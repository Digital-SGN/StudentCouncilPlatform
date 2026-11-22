using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Interfaces;
using StudentCouncil.Logic.Services;
using System.Security.Claims;
using Xunit;

namespace StudentCouncil.Tests;

public class BadgeServiceTests
{
    [Fact]
    public async Task CreateBadge_ForDeletedEvent_ThrowsNotFound()
    {
        await using AppDbContext context = CreateContext();

        context.Users.Add(new User
        {
            Id = 1,
            UserName = "admin@test.ru",
            Email = "admin@test.ru",
            FirstName = "Admin",
            LastName = "Test"
        });

        context.Users.Add(new User
        {
            Id = 2,
            UserName = "member@test.ru",
            Email = "member@test.ru",
            FirstName = "Member",
            LastName = "Test"
        });

        context.Events.Add(new Event
        {
            Id = 10,
            Title = "Deleted event",
            ResponsibleUserId = 1,
            IsDeleted = true
        });

        await context.SaveChangesAsync();

        var service = new BadgeService(
            context,
            new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        ClaimsPrincipal admin = CreatePrincipal(
            userId: 1,
            role: "Admin");

        var request = new CreateBadgeDTO
        {
            UserId = 2,
            EventId = 10,
            Role = "Участник"
        };

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.CreateBadgeAsync(request, null, admin));
    }

    [Fact]
    public async Task CreateBadge_ByResponsibleUser_CreatesBadge()
    {
        await using AppDbContext context = CreateContext();

        context.Users.Add(new User
        {
            Id = 1,
            UserName = "leader@test.ru",
            Email = "leader@test.ru",
            FirstName = "Leader",
            LastName = "Test"
        });

        context.Users.Add(new User
        {
            Id = 2,
            UserName = "member@test.ru",
            Email = "member@test.ru",
            FirstName = "Member",
            LastName = "Test"
        });

        context.Events.Add(new Event
        {
            Id = 11,
            Title = "Active event",
            ResponsibleUserId = 1,
            IsDeleted = false
        });

        await context.SaveChangesAsync();

        var service = new BadgeService(
            context,
            new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        ClaimsPrincipal responsible = CreatePrincipal(1, "Leader");
        var request = new CreateBadgeDTO
        {
            UserId = 2,
            EventId = 11,
            Role = "Организатор"
        };

        await service.CreateBadgeAsync(request, null, responsible);

        Assert.Equal(1, await context.Badges.CountAsync());
    }

    [Fact]
    public async Task GetBadgesByEvent_DeletedEvent_ThrowsNotFound()
    {
        await using AppDbContext context = CreateContext();
        context.Events.Add(new Event
        {
            Id = 12,
            Title = "Deleted",
            ResponsibleUserId = 1,
            IsDeleted = true
        });
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.GetBadgesByEventAsync(12, CreatePrincipal(1, "Admin")));
    }

    [Fact]
    public async Task GetBadgeById_Owner_CanReadBadge()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        BadgeResponseDTO result =
            await service.GetBadgeByIdAsync(1, CreatePrincipal(2, "Member"));

        Assert.Equal("Участник", result.Role);
    }

    [Fact]
    public async Task GetBadgeById_ForeignMember_ThrowsForbidden()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => service.GetBadgeByIdAsync(1, CreatePrincipal(3, "Member")));
    }

    [Fact]
    public async Task CreateBadge_Duplicate_ThrowsConflict()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        var dto = new CreateBadgeDTO { UserId = 2, EventId = 11, Role = "Другое" };

        await Assert.ThrowsAsync<ConflictException>(
            () => service.CreateBadgeAsync(dto, null, CreatePrincipal(1, "Admin")));
    }

    [Fact]
    public async Task UpdateBadge_AsResponsibleUser_UpdatesRole()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        await service.UpdateBadgeAsync(
            1,
            new UpdateBadgeDTO { Role = "Волонтёр" },
            CreatePrincipal(1, "Leader"));

        Assert.Equal("Волонтёр", (await context.Badges.FindAsync(1))?.Role);
    }

    [Fact]
    public async Task DeleteBadge_AsAdmin_RemovesBadge()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        await service.DeleteBadgeAsync(1, CreatePrincipal(1, "Admin"));

        Assert.Null(await context.Badges.FindAsync(1));
    }

    [Fact]
    public async Task DeleteBadgeFile_WithoutFile_ThrowsBadRequest()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        await Assert.ThrowsAsync<BadRequestException>(
            () => service.DeleteBadgeFileAsync(1, CreatePrincipal(1, "Admin")));
    }

    [Fact]
    public async Task DownloadBadge_ForeignMember_ThrowsForbidden()
    {
        await using AppDbContext context = CreateContext();
        AddBadgeFixture(context);
        await context.SaveChangesAsync();

        var service = new BadgeService(context, new DummyFileStorage(),
            NullLogger<BadgeService>.Instance);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => service.DownloadBadgeAsync(1, CreatePrincipal(3, "Member")));
    }

    private static void AddBadgeFixture(AppDbContext context)
    {
        context.Users.AddRange(
            new User { Id = 1, UserName = "admin@test.ru", Email = "admin@test.ru", FirstName = "Admin", LastName = "Test" },
            new User { Id = 2, UserName = "member@test.ru", Email = "member@test.ru", FirstName = "Member", LastName = "Test" });
        context.Events.Add(new Event
        {
            Id = 11,
            Title = "Active",
            Location = "Hall",
            ResponsibleUserId = 1
        });
        context.Badges.Add(new Badge
        {
            Id = 1,
            UserId = 2,
            EventId = 11,
            Role = "Участник"
        });
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static ClaimsPrincipal CreatePrincipal(int userId, string role)
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            ],
            "Test");

        return new ClaimsPrincipal(identity);
    }

    private sealed class DummyFileStorage : IFileStorageService
    {
        public Task<string> SaveFileAsync(
            IFormFile file,
            string subFolder,
            string[] allowedExtensions,
            string? fileNamePrefix = null)
        {
            return Task.FromResult("/test/file.pdf");
        }

        public void DeleteFile(string? path) { }

        public bool FileExists(string? path) => true;

        public Task<byte[]> ReadFileBytesAsync(string path) =>
            Task.FromResult(Array.Empty<byte>());

        public (string ContentType, string FileName) GetFileInfo(string path) =>
            ("application/pdf", "test.pdf");
    }
}
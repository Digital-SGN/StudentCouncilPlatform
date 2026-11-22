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

namespace StudentCouncil.Tests;

public class EventServiceTests
{
    [Fact]
    public async Task GetPublicEvents_ReturnsOnlyUpcomingActiveEvents()
    {
        await using AppDbContext context = CreateContext();

        context.Events.AddRange(
            new Event
            {
                Id = 1,
                Title = "Upcoming",
                Location = "Hall",
                Status = EventStatus.Upcoming,
                ResponsibleUserId = 1
            },
            new Event
            {
                Id = 2,
                Title = "Completed",
                Location = "Hall",
                Status = EventStatus.Completed,
                ResponsibleUserId = 1
            },
            new Event
            {
                Id = 3,
                Title = "Deleted",
                Location = "Hall",
                Status = EventStatus.Upcoming,
                ResponsibleUserId = 1,
                IsDeleted = true
            });

        await context.SaveChangesAsync();

        var service = CreateService(context);
        PublicEventListResponseDTO result = await service.GetPublicEventsAsync();

        Assert.Equal(1, result.Count);
        Assert.Equal("Upcoming", result.Events.Single().Title);
    }

    [Fact]
    public async Task CreateEvent_ByNonAdmin_ThrowsForbidden()
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

        await context.SaveChangesAsync();

        var service = CreateService(context);
        var request = new CreateEventDTO
        {
            Title = "New event",
            Location = "Hall",
            ResponsibleUserId = 1
        };

        await Assert.ThrowsAsync<ForbiddenException>(
            () => service.CreateEventAsync(request, CreatePrincipal(1, "Member")));
    }

    [Fact]
    public async Task CreateEvent_ByAdmin_ReturnsResponsibleUserName()
    {
        await using AppDbContext context = CreateContext();

        context.Users.Add(new User
        {
            Id = 1,
            UserName = "admin@test.ru",
            Email = "admin@test.ru",
            FirstName = "Ivan",
            LastName = "Ivanov",
            Patronymic = "Ivanovich"
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);
        var request = new CreateEventDTO
        {
            Title = "New event",
            Location = "Hall",
            ResponsibleUserId = 1
        };

        EventResponseDTO result =
            await service.CreateEventAsync(request, CreatePrincipal(1, "Admin"));

        Assert.Equal("Ivanov Ivan Ivanovich", result.ResponsibleUserName);
    }

    [Fact]
    public async Task GetAllEvents_ExcludesDeletedEvents()
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
        context.Events.AddRange(
            new Event { Id = 1, Title = "Active", Location = "Hall", ResponsibleUserId = 1 },
            new Event { Id = 2, Title = "Deleted", Location = "Hall", ResponsibleUserId = 1, IsDeleted = true });
        await context.SaveChangesAsync();

        EventListResponseDTO result =
            await CreateService(context).GetAllEventsAsync();

        Assert.Equal(1, result.Count);
        Assert.Equal("Active", result.Events.Single().Title);
    }

    [Fact]
    public async Task GetEventById_DeletedEvent_ThrowsNotFound()
    {
        await using AppDbContext context = CreateContext();
        context.Events.Add(new Event
        {
            Id = 4,
            Title = "Deleted",
            Location = "Hall",
            ResponsibleUserId = 1,
            IsDeleted = true
        });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(context).GetEventByIdAsync(4));
    }

    [Fact]
    public async Task UpdateEvent_ByAdmin_UpdatesFields()
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
        context.Events.Add(new Event
        {
            Id = 5,
            Title = "Old",
            Location = "Old hall",
            ResponsibleUserId = 1
        });
        await context.SaveChangesAsync();

        await CreateService(context).UpdateEventAsync(
            5,
            new UpdateEventDTO
            {
                Title = "Updated",
                Location = "New hall",
                ResponsibleUserId = 1,
                Status = EventStatus.Completed
            },
            CreatePrincipal(1, "Admin"));

        Event updated = (await context.Events.FindAsync(5))!;
        Assert.Equal("Updated", updated.Title);
        Assert.Equal(EventStatus.Completed, updated.Status);
    }

    [Fact]
    public async Task DeleteEvent_ByAdmin_SetsIsDeleted()
    {
        await using AppDbContext context = CreateContext();
        context.Events.Add(new Event
        {
            Id = 6,
            Title = "To delete",
            Location = "Hall",
            ResponsibleUserId = 1
        });
        await context.SaveChangesAsync();

        await CreateService(context).DeleteEventAsync(6, CreatePrincipal(1, "Admin"));

        Assert.True((await context.Events.FindAsync(6))!.IsDeleted);
    }

    [Fact]
    public async Task DeleteEvent_ByMember_ThrowsForbidden()
    {
        await using AppDbContext context = CreateContext();

        await Assert.ThrowsAsync<ForbiddenException>(
            () => CreateService(context).DeleteEventAsync(6, CreatePrincipal(2, "Member")));
    }

    private static EventService CreateService(AppDbContext context) =>
        new(context, new DummyFileStorage(), NullLogger<EventService>.Instance);

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
            string? fileNamePrefix = null) =>
            Task.FromResult("/test/file.jpg");

        public void DeleteFile(string? path) { }

        public bool FileExists(string? path) => true;

        public Task<byte[]> ReadFileBytesAsync(string path) =>
            Task.FromResult(Array.Empty<byte>());

        public (string ContentType, string FileName) GetFileInfo(string path) =>
            ("image/jpeg", "test.jpg");
    }
}

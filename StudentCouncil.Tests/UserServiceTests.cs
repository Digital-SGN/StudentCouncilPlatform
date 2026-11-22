using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Interfaces;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Tests;

public class UserServiceTests
{
    [Fact]
    public async Task UpdateUser_ByMemberForAnotherUser_ThrowsForbidden()
    {
        await using ServiceProvider provider = CreateProvider(out AppDbContext context);
        UserManager<User> userManager = provider.GetRequiredService<UserManager<User>>();

        var member = new User
        {
            Id = 1,
            UserName = "member@test.ru",
            Email = "member@test.ru",
            FirstName = "Member",
            LastName = "One",
            IsActive = true
        };

        var target = new User
        {
            Id = 2,
            UserName = "target@test.ru",
            Email = "target@test.ru",
            FirstName = "Target",
            LastName = "User",
            IsActive = true
        };

        Assert.True((await userManager.CreateAsync(member)).Succeeded);
        Assert.True((await userManager.CreateAsync(target)).Succeeded);

        var service = new UserService(
            userManager,
            new DummyFileStorage(),
            NullLogger<UserService>.Instance);

        var dto = new UpdateUserDTO
        {
            FirstName = "Changed",
            LastName = "Name",
            Email = "target@test.ru",
            IsActive = true
        };

        await Assert.ThrowsAsync<ForbiddenException>(
            () => service.UpdateUserAsync(target.Id, dto, CreatePrincipal(member.Id, "Member")));
    }

    [Fact]
    public async Task UpdateUser_OwnProfile_UpdatesPersonalFields()
    {
        await using ServiceProvider provider = CreateProvider(out AppDbContext context);
        UserManager<User> userManager = provider.GetRequiredService<UserManager<User>>();

        var member = new User
        {
            Id = 2,
            UserName = "member@test.ru",
            Email = "member@test.ru",
            FirstName = "Old",
            LastName = "Name",
            IsActive = true
        };

        IdentityResult createResult = await userManager.CreateAsync(member);
        Assert.True(createResult.Succeeded);

        var service = new UserService(
            userManager,
            new DummyFileStorage(),
            NullLogger<UserService>.Instance);

        var dto = new UpdateUserDTO
        {
            FirstName = "New",
            LastName = "Name",
            Email = "member@test.ru",
            IsActive = true
        };

        await service.UpdateUserAsync(member.Id, dto, CreatePrincipal(member.Id, "Member"));

        User? updated = await userManager.FindByIdAsync(member.Id.ToString());
        Assert.Equal("New", updated?.FirstName);
    }

    [Fact]
    public async Task GetAllUsers_ReturnsRoleAndUserCount()
    {
        await using ServiceProvider provider = CreateProvider(out AppDbContext context);
        UserManager<User> userManager = provider.GetRequiredService<UserManager<User>>();
        RoleManager<IdentityRole<int>> roleManager =
            provider.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await roleManager.CreateAsync(new IdentityRole<int>("Member"));
        var member = new User
        {
            Id = 3,
            UserName = "listed@test.ru",
            Email = "listed@test.ru",
            FirstName = "Listed",
            LastName = "User",
            IsActive = true
        };
        Assert.True((await userManager.CreateAsync(member)).Succeeded);
        Assert.True((await userManager.AddToRoleAsync(member, "Member")).Succeeded);

        var service = new UserService(userManager, new DummyFileStorage(),
            NullLogger<UserService>.Instance);

        UserListResponseDTO result =
            await service.GetAllUsersAsync(CreatePrincipal(3, "Member"));

        Assert.Equal(1, result.Count);
        Assert.Equal("Member", result.Users?.Single().Role);
    }

    [Fact]
    public async Task CreateUser_InvalidRole_ThrowsBadRequest()
    {
        await using ServiceProvider provider = CreateProvider(out AppDbContext context);
        UserManager<User> userManager = provider.GetRequiredService<UserManager<User>>();
        var service = new UserService(userManager, new DummyFileStorage(),
            NullLogger<UserService>.Instance);

        var dto = new CreateUserDTO
        {
            Email = "invalid@test.ru",
            Password = "Password1",
            FirstName = "Invalid",
            LastName = "Role",
            Role = "Owner"
        };

        await Assert.ThrowsAsync<BadRequestException>(
            () => service.CreateUserAsync(dto, dto.Password));
    }

    [Fact]
    public async Task CreateUser_DuplicateEmail_ThrowsConflict()
    {
        await using ServiceProvider provider = CreateProvider(out AppDbContext context);
        UserManager<User> userManager = provider.GetRequiredService<UserManager<User>>();
        var existing = new User
        {
            Id = 4,
            UserName = "same@test.ru",
            Email = "same@test.ru",
            FirstName = "Existing",
            LastName = "User"
        };
        Assert.True((await userManager.CreateAsync(existing)).Succeeded);

        var service = new UserService(userManager, new DummyFileStorage(),
            NullLogger<UserService>.Instance);
        var dto = new CreateUserDTO
        {
            Email = "same@test.ru",
            Password = "Password1",
            FirstName = "Duplicate",
            LastName = "User",
            Role = "Member"
        };

        await Assert.ThrowsAsync<ConflictException>(
            () => service.CreateUserAsync(dto, dto.Password));
    }

    [Fact]
    public async Task ResetPassword_ByMember_ThrowsForbidden()
    {
        await using ServiceProvider provider = CreateProvider(out AppDbContext context);
        UserManager<User> userManager = provider.GetRequiredService<UserManager<User>>();
        var service = new UserService(userManager, new DummyFileStorage(),
            NullLogger<UserService>.Instance);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => service.ResetPasswordAsync(
                1,
                "NewPassword1",
                CreatePrincipal(1, "Member")));
    }

    private static ServiceProvider CreateProvider(out AppDbContext context)
    {
        var services = new ServiceCollection();
        string databaseName = Guid.NewGuid().ToString();

        services.AddLogging();
        services
            .AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(databaseName));
        services
            .AddIdentityCore<User>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
            })
            .AddRoles<IdentityRole<int>>()
            .AddEntityFrameworkStores<AppDbContext>();

        ServiceProvider provider = services.BuildServiceProvider();
        context = provider.GetRequiredService<AppDbContext>();
        return provider;
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

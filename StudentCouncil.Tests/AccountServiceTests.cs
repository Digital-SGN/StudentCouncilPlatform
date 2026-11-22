using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Tests;

public class AccountServiceTests
{
    [Fact]
    public async Task Login_UnknownEmail_ReturnsError()
    {
        await using ServiceProvider provider = CreateProvider();
        AccountService service = CreateService(provider);

        LoginResultDTO result = await service.LoginAsync(new LoginRequestDTO
        {
            Email = "unknown@test.ru",
            Password = "Password1"
        });

        Assert.Equal(LoginStatus.Error, result.Status);
        Assert.Equal("Неверный email или пароль", result.Error);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsError()
    {
        await using ServiceProvider provider = CreateProvider();
        UserManager<User> userManager =
            provider.GetRequiredService<UserManager<User>>();

        var user = new User
        {
            Id = 1,
            UserName = "member@test.ru",
            Email = "member@test.ru",
            EmailConfirmed = true,
            FirstName = "Member",
            LastName = "Test",
            IsActive = true
        };

        Assert.True((await userManager.CreateAsync(user, "Password1")).Succeeded);

        AccountService service = CreateService(provider);
        LoginResultDTO result = await service.LoginAsync(new LoginRequestDTO
        {
            Email = user.Email,
            Password = "WrongPassword"
        });

        Assert.Equal(LoginStatus.Error, result.Status);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsSuccess()
    {
        await using ServiceProvider provider = CreateProvider();
        UserManager<User> userManager =
            provider.GetRequiredService<UserManager<User>>();
        RoleManager<IdentityRole<int>> roleManager =
            provider.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await roleManager.CreateAsync(new IdentityRole<int>("Member"));

        var user = new User
        {
            Id = 2,
            UserName = "success@test.ru",
            Email = "success@test.ru",
            EmailConfirmed = true,
            FirstName = "Success",
            LastName = "User",
            IsActive = true
        };

        Assert.True((await userManager.CreateAsync(user, "Password1")).Succeeded);
        Assert.True((await userManager.AddToRoleAsync(user, "Member")).Succeeded);

        AccountService service = CreateService(provider);
        LoginResultDTO result = await service.LoginAsync(new LoginRequestDTO
        {
            Email = user.Email,
            Password = "Password1"
        });

        Assert.Equal(LoginStatus.Success, result.Status);
        Assert.Equal("Member", result.User?.Role);
    }

    [Fact]
    public async Task GetCurrentUser_ExistingUser_ReturnsProfile()
    {
        await using ServiceProvider provider = CreateProvider();
        UserManager<User> userManager =
            provider.GetRequiredService<UserManager<User>>();

        var user = new User
        {
            Id = 3,
            UserName = "profile@test.ru",
            Email = "profile@test.ru",
            FirstName = "Profile",
            LastName = "User",
            IsActive = true
        };
        Assert.True((await userManager.CreateAsync(user)).Succeeded);

        AccountService service = CreateService(provider);
        CurrentUserDTO result =
            await service.GetCurrentUserAsync(CreatePrincipal(user.Id));

        Assert.Equal(user.Id, result.Id);
        Assert.Equal("profile@test.ru", result.Email);
    }

    [Fact]
    public async Task ResetTwoFactor_UserWithout2Fa_ThrowsBadRequest()
    {
        await using ServiceProvider provider = CreateProvider();
        UserManager<User> userManager =
            provider.GetRequiredService<UserManager<User>>();

        var user = new User
        {
            Id = 4,
            UserName = "no2fa@test.ru",
            Email = "no2fa@test.ru",
            FirstName = "No",
            LastName = "TwoFactor",
            IsActive = true
        };
        Assert.True((await userManager.CreateAsync(user)).Succeeded);

        AccountService service = CreateService(provider);

        await Assert.ThrowsAsync<BadRequestException>(
            () => service.ResetTwoFactorAsync(user.Id));
    }

    [Fact]
    public async Task LogoutAsync_DoesNotThrow()
    {
        await using ServiceProvider provider = CreateProvider();
        AccountService service = CreateService(provider);

        await service.LogoutAsync();
    }

    private static AccountService CreateService(ServiceProvider provider)
    {
        var userManager = provider.GetRequiredService<UserManager<User>>();
        var signInManager = provider.GetRequiredService<SignInManager<User>>();
        var loginCodes = new LoginCodeService(
            provider.GetRequiredService<IMemoryCache>(),
            Options.Create(new SmtpOptions()),
            NullLogger<LoginCodeService>.Instance);

        return new AccountService(
            userManager,
            signInManager,
            loginCodes,
            NullLogger<AccountService>.Instance);
    }

    private static ServiceProvider CreateProvider()
    {
        var services = new ServiceCollection();

        services.AddLogging();
        services.AddMemoryCache();
        services.AddHttpContextAccessor();
        services.AddAuthentication();
        services
            .AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services
            .AddIdentity<User, IdentityRole<int>>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        ServiceProvider provider = services.BuildServiceProvider();
        var httpContext = new DefaultHttpContext
        {
            RequestServices = provider
        };
        provider.GetRequiredService<IHttpContextAccessor>().HttpContext = httpContext;
        return provider;
    }

    private static ClaimsPrincipal CreatePrincipal(int userId)
    {
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            "Test");

        return new ClaimsPrincipal(identity);
    }
}

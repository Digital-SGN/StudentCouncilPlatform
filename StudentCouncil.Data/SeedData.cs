using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using StudentCouncil.Data.Models;

namespace StudentCouncil.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        UserManager<User> userManager = serviceProvider.GetRequiredService<UserManager<User>>();
        RoleManager<IdentityRole<int>> roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

        string[] roles = { "Admin", "Leader", "Member" };
        foreach (string role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(role));
            }
        }

        string adminEmail = "testing@gmail.com";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            User admin = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Главный",
                LastName = "Администратор",
                JoinedAt = DateTime.UtcNow,
                IsActive = true
            };

            IdentityResult result = await userManager.CreateAsync(admin, "test123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
            Console.WriteLine("Admin is inizialized!");
        }
    }
}
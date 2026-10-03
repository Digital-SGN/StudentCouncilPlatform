using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Data.Models;

public class User : IdentityUser<int>
{
    [MaxLength(20), Required]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(20), Required]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Patronymic { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? Group { get; set; }

    public DateOnly? BirthDate { get; set; }

    [MaxLength(20)]
    public string? Telegram { get; set; }

    [MaxLength(10)]
    public string? ClothingSize { get; set; }

    public string? AvatarPath { get; set; }

    public int Balance { get; set; } = 0;

    public int TotalPointsEarned { get; set; } = 0;

    public int ExperiencePoints { get; set; } = 0;

    public int Level { get; set; } = 1;

    public int EventsAttended { get; set; } = 0;

    public int EventsOrganized { get; set; } = 0;

    public int TasksCompleted { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset LastActivityDate { get; set; } = DateTimeOffset.UtcNow;

}
using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Logic.DTOs;

public class ResetPasswordDTO
{
    [Required, MinLength(6), MaxLength(100)]
    public string NewPassword { get; set; } = string.Empty;
}
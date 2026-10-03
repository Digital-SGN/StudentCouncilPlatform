using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Logic.DTOs;

public class BadgeResponseDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
public class CreateBadgeDTO
{
    [Range(1, int.MaxValue)]
    public int UserId { get; set; }

    [Range(1, int.MaxValue)]
    public int EventId { get; set; }

    [Required, MaxLength(100)]
    public string Role { get; set; } = string.Empty;
}

public class UpdateBadgeDTO
{
    [Required, MaxLength(100)]
    public string Role { get; set; } = string.Empty;
}

public class BadgeListResponseDTO
{
    public int Count { get; set; }
    public List<BadgeResponseDTO> Badges { get; set; } = new();
}
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
    public int UserId { get; set; }
    public int EventId { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class UpdateBadgeDTO
{
    public string Role { get; set; } = string.Empty;
}

public class BadgeListResponseDTO
{
    public int Count { get; set; }
    public List<BadgeResponseDTO> Badges { get; set; } = new();
}
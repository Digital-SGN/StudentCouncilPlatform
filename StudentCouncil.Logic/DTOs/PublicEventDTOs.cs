namespace StudentCouncil.Logic.DTOs
{
    public class PublicEventResponseDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
    }

    public class PublicEventListResponseDTO
    {
        public int Count { get; set; }
        public List<PublicEventResponseDTO> Events { get; set; } = [];
    }
}
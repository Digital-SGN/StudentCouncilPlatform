namespace StudentCouncil.Logic.DTOs.LoginDTOs
{
    public class LoginResponseDTO
    {
        public int Id { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Role { get; set; }
    }
}

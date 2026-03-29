namespace StudentCouncil.Logic.DTOs.UsersDTOs
{
    public class UserListResponseDTO
    {
        public int Count { get; set; }
        public List<UserDTO>? Users { get; set; }
    }
}

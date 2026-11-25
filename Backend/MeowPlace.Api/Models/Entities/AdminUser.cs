using System.Security.Cryptography;
using System.Text;

namespace MeowPlace.Api.Models.Entities;

public class AdminUser : BaseEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = "Administrator MeowPlace";
    public string Role { get; set; } = "Admin";

    public bool VerifyPassword(string password)
    {
        var hash = HashPassword(password);
        return PasswordHash == hash;
    }

    public void SetPassword(string password)
    {
        PasswordHash = HashPassword(password);
        UpdatedAt = DateTime.UtcNow;
    }

    public static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password + "_meow_salt_2026"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.DTOs;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly MeowPlaceDbContext _context;

    public AuthController(MeowPlaceDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new LoginResponseDto
            {
                Success = false,
                Message = "Username dan password wajib diisi."
            });
        }

        var admin = await _context.AdminUsers
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());

        if (admin == null || !admin.VerifyPassword(request.Password))
        {
            return Unauthorized(new LoginResponseDto
            {
                Success = false,
                Message = "Username atau password admin salah!"
            });
        }

        // Token sesi sederhana untuk verifikasi akses dashboard
        var token = $"adm_{Guid.NewGuid():N}_{DateTime.UtcNow.Ticks}";

        return Ok(new LoginResponseDto
        {
            Success = true,
            Message = "Login berhasil!",
            Token = token,
            Username = admin.Username,
            FullName = admin.FullName,
            Role = admin.Role
        });
    }

    [HttpGet("verify")]
    public IActionResult VerifyToken([FromHeader(Name = "Authorization")] string? authHeader)
    {
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer adm_"))
        {
            return Unauthorized(new { valid = false, message = "Sesi tidak valid." });
        }
        return Ok(new { valid = true, message = "Sesi valid." });
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Models.Entities;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsletterController : ControllerBase
{
    private readonly MeowPlaceDbContext _context;

    public NewsletterController(MeowPlaceDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Subscribe([FromBody] NewsletterRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return BadRequest(new { ok = false, message = "Email tidak valid." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var exists = await _context.NewsletterSubscriptions.AnyAsync(n => n.Email == normalizedEmail);

        if (!exists)
        {
            _context.NewsletterSubscriptions.Add(new NewsletterSubscription { Email = normalizedEmail });
            await _context.SaveChangesAsync();
        }

        return Ok(new { ok = true, message = "Terima kasih telah berlangganan info promo MeowPlace!" });
    }
}

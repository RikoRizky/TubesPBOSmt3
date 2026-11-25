using Microsoft.AspNetCore.Mvc;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.Entities;
using MeowPlace.Api.Models.Enums;
using MeowPlace.Api.Repositories;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReturnsController : ControllerBase
{
    private readonly IOrderRepository _orderRepository;
    private readonly MeowPlaceDbContext _context;

    public ReturnsController(IOrderRepository orderRepository, MeowPlaceDbContext context)
    {
        _orderRepository = orderRepository;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> RequestReturn([FromForm] string orderId, [FromForm] string email, [FromForm] string reason, [FromForm] string note, IFormFile? photo)
    {
        var order = await _orderRepository.FindByIdAndEmailAsync(orderId, email);
        if (order == null)
        {
            return NotFound(new { message = "Pesanan tidak ditemukan." });
        }

        // Syarat retur: pesanan harus sudah sampai
        if (order.Status != OrderStatus.Sampai)
        {
            string statusStr = order.Status switch
            {
                OrderStatus.Dibuat => "dibuat",
                OrderStatus.Dibayar => "dibayar",
                OrderStatus.Dikemas => "dikemas",
                OrderStatus.Dikirim => "dikirim",
                _ => "proses"
            };
            return Conflict(new { status = statusStr });
        }

        ReturnReason returnReason = reason.ToLower() switch
        {
            "doyan" => ReturnReason.TidakDoyan,
            "rusak" => ReturnReason.Rusak,
            "salah" => ReturnReason.SalahKirim,
            _ => ReturnReason.Lainnya
        };

        var ticket = $"RET-{DateTime.UtcNow:yyMMdd}{Random.Shared.Next(1000, 9999)}";

        var orderReturn = new OrderReturn
        {
            Ticket = ticket,
            OrderId = order.Id,
            Email = order.Email,
            Reason = returnReason,
            Note = note ?? string.Empty
        };

        _context.OrderReturns.Add(orderReturn);
        await _context.SaveChangesAsync();

        return Ok(new { ticket });
    }
}

using Microsoft.AspNetCore.Mvc;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Services;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("track")]
    public async Task<ActionResult<OrderDto>> TrackOrder([FromBody] TrackOrderRequest request)
    {
        var order = await _orderService.TrackOrderAsync(request.OrderId, request.Email);
        if (order == null)
        {
            return NotFound(new { message = "Pesanan tidak ditemukan dengan nomor dan email tersebut." });
        }
        return Ok(order);
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<OrderDto>> Checkout([FromBody] CheckoutRequestDto request)
    {
        try
        {
            var order = await _orderService.CreateOrderAsync(request);
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetHistory([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Parameter email wajib diisi." });
        }
        var orders = await _orderService.GetHistoryByEmailAsync(email);
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(string id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null)
        {
            return NotFound(new { message = $"Pesanan {id} tidak ditemukan." });
        }
        return Ok(order);
    }
}

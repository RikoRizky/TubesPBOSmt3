using Microsoft.AspNetCore.Mvc;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Services;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpPost]
    public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto dto)
    {
        try
        {
            var result = await _reviewService.CreateReviewAsync(dto);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetByProduct(string productId)
    {
        var reviews = await _reviewService.GetReviewsByProductIdAsync(productId);
        return Ok(reviews);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetAll()
    {
        var reviews = await _reviewService.GetAllReviewsAsync();
        return Ok(reviews);
    }
}

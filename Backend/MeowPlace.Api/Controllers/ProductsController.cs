using Microsoft.AspNetCore.Mvc;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Repositories;
using MeowPlace.Api.Services;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _productRepository;

    public ProductsController(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
    {
        var products = await _productRepository.GetActiveProductsAsync();
        return Ok(products.Select(p => p.ToDto()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return NotFound(new { message = $"Produk {id} tidak ditemukan." });
        return Ok(product.ToDto());
    }
}

using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Models.Entities;
using MeowPlace.Api.Repositories;

namespace MeowPlace.Api.Services;

public interface IReviewService
{
    Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto);
    Task<IEnumerable<ReviewDto>> GetReviewsByProductIdAsync(string productId);
    Task<IEnumerable<ReviewDto>> GetAllReviewsAsync();
}

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IProductRepository _productRepository;

    public ReviewService(IReviewRepository reviewRepository, IProductRepository productRepository)
    {
        _reviewRepository = reviewRepository;
        _productRepository = productRepository;
    }

    public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto)
    {
        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product == null)
        {
            throw new ArgumentException($"Produk dengan ID {dto.ProductId} tidak ditemukan.");
        }

        // Batasi rating 1 sampai 5
        int productRating = Math.Clamp(dto.ProductRating, 1, 5);
        int serviceRating = Math.Clamp(dto.ServiceRating, 1, 5);

        var review = new Review
        {
            ProductId = dto.ProductId,
            OrderId = string.IsNullOrWhiteSpace(dto.OrderId) ? null : dto.OrderId.Trim(),
            CustomerName = string.IsNullOrWhiteSpace(dto.CustomerName) ? "Pelanggan MeowPlace" : dto.CustomerName.Trim(),
            Email = dto.Email.Trim(),
            ProductRating = productRating,
            ServiceRating = serviceRating,
            Comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment.Trim()
        };

        await _reviewRepository.AddAsync(review);

        // Update rating agregat produk via metode domain OOP
        product.RecalculateRating(productRating);
        await _productRepository.UpdateAsync(product);

        review.Product = product;
        return review.ToDto();
    }

    public async Task<IEnumerable<ReviewDto>> GetReviewsByProductIdAsync(string productId)
    {
        var reviews = await _reviewRepository.GetByProductIdAsync(productId);
        return reviews.Select(r => r.ToDto());
    }

    public async Task<IEnumerable<ReviewDto>> GetAllReviewsAsync()
    {
        var reviews = await _reviewRepository.GetAllReviewsWithDetailsAsync();
        return reviews.Select(r => r.ToDto());
    }
}

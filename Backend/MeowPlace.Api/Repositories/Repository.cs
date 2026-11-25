using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.Entities;

namespace MeowPlace.Api.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly MeowPlaceDbContext Context;
    protected readonly DbSet<T> DbSet;

    public Repository(MeowPlaceDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await DbSet.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await DbSet.Where(predicate).ToListAsync();
    }

    public virtual async Task<T?> GetByIdAsync(object id)
    {
        return await DbSet.FindAsync(id);
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await DbSet.AddAsync(entity);
        await Context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        DbSet.Update(entity);
        await Context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(T entity)
    {
        DbSet.Remove(entity);
        await Context.SaveChangesAsync();
    }

    public virtual async Task<int> SaveChangesAsync()
    {
        return await Context.SaveChangesAsync();
    }
}

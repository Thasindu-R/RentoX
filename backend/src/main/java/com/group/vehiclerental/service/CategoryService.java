package com.group.vehiclerental.service;

import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Category;
import com.group.vehiclerental.repository.CategoryRepository;
import com.group.vehiclerental.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Module 2 - Vehicle Category Management.
 */
@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final VehicleRepository vehicleRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           VehicleRepository vehicleRepository) {
        this.categoryRepository = categoryRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Category findById(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    @Transactional(readOnly = true)
    public List<Category> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }
        return categoryRepository.findByCategoryNameContainingIgnoreCase(query);
    }

    public Category create(Category category) {
        if (categoryRepository.existsByCategoryNameIgnoreCase(category.getCategoryName())) {
            throw new BusinessRuleException(
                    "A category named " + category.getCategoryName() + " already exists");
        }
        category.setCategoryId(null);
        return categoryRepository.save(category);
    }

    public Category update(Integer id, Category changes) {
        Category existing = findById(id);

        categoryRepository.findByCategoryNameIgnoreCase(changes.getCategoryName())
                .filter(other -> !other.getCategoryId().equals(id))
                .ifPresent(other -> {
                    throw new BusinessRuleException(
                            "Another category is already named " + changes.getCategoryName());
                });

        existing.setCategoryName(changes.getCategoryName());
        existing.setDescription(changes.getDescription());
        existing.setDailyRate(changes.getDailyRate());
        existing.setSeatingCapacity(changes.getSeatingCapacity());
        return categoryRepository.save(existing);
    }

    /**
     * Proposal: "Delete a category (only if no vehicles use it)".
     * This mirrors fk_vehicle_category being ON DELETE RESTRICT in the schema,
     * but gives the user a sentence instead of a constraint violation.
     */
    public void delete(Integer id) {
        Category category = findById(id);
        long vehiclesUsing = vehicleRepository.countByCategory_CategoryId(id);
        if (vehiclesUsing > 0) {
            throw new BusinessRuleException("Cannot delete category "
                    + category.getCategoryName() + " because " + vehiclesUsing
                    + " vehicle(s) still use it");
        }
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public long count() {
        return categoryRepository.count();
    }
}

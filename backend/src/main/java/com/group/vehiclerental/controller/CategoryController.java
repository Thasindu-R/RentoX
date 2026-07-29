package com.group.vehiclerental.controller;

import com.group.vehiclerental.model.Category;
import com.group.vehiclerental.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Module 2 - Vehicle Category Management.
 *
 * GET    /api/categories         list all, or ?search=car
 * GET    /api/categories/{id}    one category
 * POST   /api/categories         create
 * PUT    /api/categories/{id}    update
 * DELETE /api/categories/{id}    delete (409 if vehicles still use it)
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Category> list(@RequestParam(required = false) String search) {
        return categoryService.search(search);
    }

    @GetMapping("/{id}")
    public Category getOne(@PathVariable Integer id) {
        return categoryService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Category> create(@Valid @RequestBody Category category) {
        Category saved = categoryService.create(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Category update(@PathVariable Integer id, @Valid @RequestBody Category category) {
        return categoryService.update(id, category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public long count() {
        return categoryService.count();
    }
}

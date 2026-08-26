package com.socialflow.controller;

import com.socialflow.dto.BranchRequest;
import com.socialflow.dto.BranchResponse;
import com.socialflow.dto.RestaurantRequest;
import com.socialflow.dto.RestaurantResponse;
import com.socialflow.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponse>> getAllRestaurants(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(restaurantService.getAllRestaurants(email, isAdmin(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponse> getRestaurantById(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(restaurantService.getRestaurantById(id, email, isAdmin(authentication)));
    }

    @PostMapping
    public ResponseEntity<RestaurantResponse> createRestaurant(@Valid @RequestBody RestaurantRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return new ResponseEntity<>(restaurantService.createRestaurant(request, email), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantResponse> updateRestaurant(@PathVariable Long id, @RequestBody RestaurantRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(restaurantService.updateRestaurant(id, request, email, isAdmin(authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        restaurantService.deleteRestaurant(id, email, isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/branches")
    public ResponseEntity<List<BranchResponse>> getBranches(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(restaurantService.getBranchesByRestaurantId(id, email, isAdmin(authentication)));
    }

    @PostMapping("/{id}/branches")
    public ResponseEntity<BranchResponse> addBranch(@PathVariable Long id, @Valid @RequestBody BranchRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return new ResponseEntity<>(restaurantService.addBranch(id, request, email, isAdmin(authentication)), HttpStatus.CREATED);
    }
}

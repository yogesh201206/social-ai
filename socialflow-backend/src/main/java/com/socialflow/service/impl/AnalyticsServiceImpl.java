package com.socialflow.service.impl;

import com.socialflow.dto.AnalyticsOverviewDto;
import com.socialflow.dto.AnalyticsResponse;
import com.socialflow.entity.Analytics;
import com.socialflow.entity.Platform;
import com.socialflow.repository.AnalyticsRepository;
import com.socialflow.repository.PostRepository;
import com.socialflow.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final PostRepository postRepository;

    @Override
    public AnalyticsOverviewDto getOverview(Long restaurantId, Long branchId, String currentUserEmail, boolean isAdmin) {
        List<Analytics> list;
        if (restaurantId != null) {
            list = analyticsRepository.findByRestaurantId(restaurantId);
        } else if (!isAdmin) {
            list = analyticsRepository.findByRestaurantOwnerEmail(currentUserEmail);
        } else {
            list = analyticsRepository.findAll();
        }

        int totalReach = list.stream().mapToInt(a -> a.getReach() != null ? a.getReach() : 0).sum();
        int totalImpressions = list.stream().mapToInt(a -> a.getImpressions() != null ? a.getImpressions() : 0).sum();
        int totalLikes = list.stream().mapToInt(a -> a.getLikes() != null ? a.getLikes() : 0).sum();
        int totalComments = list.stream().mapToInt(a -> a.getComments() != null ? a.getComments() : 0).sum();
        int totalShares = list.stream().mapToInt(a -> a.getShares() != null ? a.getShares() : 0).sum();
        int totalFollowers = list.stream().mapToInt(a -> a.getFollowers() != null ? a.getFollowers() : 0).max().orElse(0);

        double avgEngagementRate = list.isEmpty() ? 0.0 :
                list.stream().mapToDouble(a -> a.getEngagementRate() != null ? a.getEngagementRate() : 0.0).average().orElse(0.0);

        int totalPosts = (int) (isAdmin ? postRepository.count() : postRepository.findByRestaurantOwnerEmail(currentUserEmail).size());

        return AnalyticsOverviewDto.builder()
                .totalReach(totalReach)
                .totalImpressions(totalImpressions)
                .totalLikes(totalLikes)
                .totalComments(totalComments)
                .totalShares(totalShares)
                .totalFollowers(totalFollowers)
                .averageEngagementRate(avgEngagementRate)
                .totalPosts(totalPosts)
                .build();
    }

    @Override
    public List<AnalyticsResponse> getPlatformAnalytics(Long restaurantId, Platform platform, String currentUserEmail, boolean isAdmin) {
        List<Analytics> list;
        if (restaurantId != null && platform != null) {
            list = analyticsRepository.findByRestaurantIdAndPlatform(restaurantId, platform);
        } else if (restaurantId != null) {
            list = analyticsRepository.findByRestaurantId(restaurantId);
        } else if (!isAdmin) {
            list = analyticsRepository.findByRestaurantOwnerEmail(currentUserEmail);
        } else {
            list = analyticsRepository.findAll();
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AnalyticsResponse> getPostAnalytics(Long restaurantId, String currentUserEmail, boolean isAdmin) {
        return getPlatformAnalytics(restaurantId, null, currentUserEmail, isAdmin);
    }

    private AnalyticsResponse mapToResponse(Analytics a) {
        return AnalyticsResponse.builder()
                .id(a.getId())
                .restaurantId(a.getRestaurant().getId())
                .restaurantName(a.getRestaurant().getName())
                .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                .branchName(a.getBranch() != null ? a.getBranch().getBranchName() : null)
                .platform(a.getPlatform())
                .date(a.getDate())
                .reach(a.getReach())
                .impressions(a.getImpressions())
                .likes(a.getLikes())
                .comments(a.getComments())
                .shares(a.getShares())
                .followers(a.getFollowers())
                .engagementRate(a.getEngagementRate())
                .build();
    }
}

package com.socialflow.service;

import com.socialflow.dto.PostActivitiesResponse;

public interface SocialActivityService {
    PostActivitiesResponse getActivities(Long postId, String currentUserEmail, boolean isAdmin);
    PostActivitiesResponse refreshActivities(Long postId, String currentUserEmail, boolean isAdmin);
}

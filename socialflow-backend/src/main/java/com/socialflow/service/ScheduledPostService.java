package com.socialflow.service;

import com.socialflow.dto.ScheduleRequest;
import com.socialflow.dto.ScheduleResponse;

import java.util.List;

public interface ScheduledPostService {
    List<ScheduleResponse> getAllSchedules(String currentUserEmail, boolean isAdmin);
    ScheduleResponse getScheduleById(Long id, String currentUserEmail, boolean isAdmin);
    ScheduleResponse createSchedule(ScheduleRequest request, String currentUserEmail, boolean isAdmin);
    ScheduleResponse updateSchedule(Long id, ScheduleRequest request, String currentUserEmail, boolean isAdmin);
    void deleteSchedule(Long id, String currentUserEmail, boolean isAdmin);
    ScheduleResponse cancelSchedule(Long id, String currentUserEmail, boolean isAdmin);
}

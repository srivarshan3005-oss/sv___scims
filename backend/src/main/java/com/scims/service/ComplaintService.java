package com.scims.service;

import com.scims.dto.request.ComplaintRequest;
import com.scims.dto.request.StatusUpdateRequest;
import com.scims.dto.response.ComplaintResponse;
import com.scims.dto.response.PageResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ComplaintService {

    ComplaintResponse createComplaint(ComplaintRequest request, MultipartFile image, Long userId);

    ComplaintResponse getComplaintById(Long id, Long requestingUserId, String role);

    PageResponse<ComplaintResponse> getComplaintsByUser(Long userId, int page, int size);

    PageResponse<ComplaintResponse> getAllComplaints(String status, Long categoryId,
                                                     String search, int page, int size);

    /**
     * Same filters as getAllComplaints but scoped to a single department —
     * used by Sub Admins, who must only see complaints routed to their
     * own department.
     */
    PageResponse<ComplaintResponse> getComplaintsByDepartment(Long departmentId, String status,
                                                     Long categoryId, String search,
                                                     int page, int size);

    ComplaintResponse updateStatus(Long complaintId, StatusUpdateRequest request, Long adminId);

    void deleteComplaint(Long complaintId, Long userId, String role);
}

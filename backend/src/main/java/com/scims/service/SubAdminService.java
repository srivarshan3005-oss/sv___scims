package com.scims.service;

import com.scims.dto.request.SubAdminRequest;
import com.scims.dto.response.PageResponse;
import com.scims.dto.response.SubAdminResponse;

public interface SubAdminService {
    PageResponse<SubAdminResponse> getAllSubAdmins(Long departmentId, String search, int page, int size);
    SubAdminResponse getSubAdminById(Long id);
    SubAdminResponse createSubAdmin(SubAdminRequest request);
    SubAdminResponse updateSubAdmin(Long id, SubAdminRequest request);
    SubAdminResponse toggleSubAdminStatus(Long id);
    void deleteSubAdmin(Long id);
}

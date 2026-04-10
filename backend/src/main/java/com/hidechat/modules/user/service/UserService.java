package com.hidechat.modules.user.service;

import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.vo.UserSearchItemVO;
import com.hidechat.modules.user.vo.UserProfileVO;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface UserService {

    UserProfileVO getUserProfile(String userUid);

    List<UserSearchItemVO> searchUsers(String currentUserUid, String keyword);

    Map<String, UserProfileVO> getUserProfiles(Collection<String> userUids);

    void updateProfile(String userUid, UpdateProfileRequest request);
}

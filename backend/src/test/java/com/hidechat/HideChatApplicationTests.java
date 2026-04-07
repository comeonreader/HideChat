package com.hidechat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.hidechat.common.response.ApiResponse;
import org.junit.jupiter.api.Test;

class HideChatApplicationTests {

    @Test
    void smokeTest() {
        ApiResponse<String> response = ApiResponse.success("ok");

        assertNotNull(HideChatApplication.class);
        assertEquals(0, response.getCode());
        assertEquals("success", response.getMessage());
        assertEquals("ok", response.getData());
    }
}

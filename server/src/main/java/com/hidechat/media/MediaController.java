package com.hidechat.media;

import com.hidechat.security.AuthInterceptor;
import com.hidechat.user.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class MediaController {
    private final MediaService service;

    public MediaController(MediaService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(HttpServletRequest http,
                                      @RequestParam String kind,
                                      @RequestParam("file") MultipartFile file,
                                      @RequestParam(required = false) Long width,
                                      @RequestParam(required = false) Long height,
                                      @RequestParam(required = false) Double duration) {
        User me = (User) http.getAttribute(AuthInterceptor.ATTR_USER);
        return service.upload(me, kind, file, width, height, duration);
    }
}

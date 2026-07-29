package com.group.vehiclerental.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Throwaway controller used to confirm the backend starts and responds.
 * Delete this once the real module controllers are in place.
 *
 * @RestController = @Controller + @ResponseBody, so the returned String is
 * written straight into the HTTP response body instead of being treated
 * as the name of a view template.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}

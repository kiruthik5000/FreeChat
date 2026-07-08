package com.lanchat.controller;

import com.lanchat.entity.Otp;
import com.lanchat.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email){
        otpService.sendOtp(email);
        return ResponseEntity.ok("Otp Sent");
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otp) throws Exception {
        boolean res = otpService.verifyOtp(email, otp);

        if (res) {
            return ResponseEntity.ok("Otp Verified");
        } else  {
            return ResponseEntity.badRequest().body("Invalid Otp");
        }
    }

}

package com.lanchat.service;

import com.lanchat.entity.Otp;
import com.lanchat.exception.InvalidUniqueIdException;
import com.lanchat.repository.OtpRepository;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    @Autowired
    private JavaMailSender javaMailSender;

    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    public void sendOtp(String email) {

        String otp = generateOtp();
        Otp dbOtp = new Otp();
        dbOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        dbOtp.setUniqueId(email);
        dbOtp.setOtp(otp);
        otpRepository.save(dbOtp);
        email = email+"@skcet.ac.in";

        SimpleMailMessage simpleMailMessage = new SimpleMailMessage();

        simpleMailMessage.setTo(email);
        simpleMailMessage.setSubject("OTP RECEIVED");
        simpleMailMessage.setText("Your OTP for verification is " + otp);

        javaMailSender.send(simpleMailMessage);


    }

    public boolean verifyOtp(String email,  String otp) throws Exception {
        Otp dbOtpExist = otpRepository.findByUniqueId(email).orElseThrow(
                () ->new InvalidUniqueIdException("User NOT FOUND")
        );


        if (LocalDateTime.now().isAfter(dbOtpExist.getExpiryTime())) {
            otpRepository.deleteByUniqueId(email);
            throw new BadRequestException("Otp Expired ");
        }

        if (!dbOtpExist.getOtp().equals(otp)) {
            throw new BadRequestException("Invalid Otp");
        }
        otpRepository.deleteByUniqueId(email);
        return true;
    }

    private String generateOtp() {
        Random random = new Random();

        return String.format("%06d", random.nextInt(10000));
    }
}

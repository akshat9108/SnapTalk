package com.snaptalk.controller;

import com.snaptalk.service.OCRService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@Controller
@RequestMapping("/api")
public class OCRController {

    private static final Logger logger = Logger.getLogger(OCRController.class.getName());

    @Autowired
    private OCRService ocrService;

    @PostMapping("/extract-text")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> extractText(@RequestParam("image") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            logger.info("Received file upload request: " + file.getOriginalFilename());

            // Extract text from uploaded image
            String extractedText = ocrService.extractTextFromImage(file);

            response.put("success", true);
            response.put("extractedText", extractedText);
            response.put("message", "Text extracted successfully");
            response.put("processingTime", "< 2 seconds");

            logger.info("Text extraction successful");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error during text extraction: " + e.getMessage());

            response.put("success", false);
            response.put("extractedText", "");
            response.put("message", "Error extracting text: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/extract-text-camera")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> extractTextFromCamera(@RequestBody Map<String, String> requestBody) {
        Map<String, Object> response = new HashMap<>();

        try {
            String base64Image = requestBody.get("image");

            if (base64Image == null || base64Image.isEmpty()) {
                response.put("success", false);
                response.put("message", "No image data provided");
                return ResponseEntity.badRequest().body(response);
            }

            logger.info("Received camera capture request");

            // Extract text from base64 image
            String extractedText = ocrService.extractTextFromBase64Image(base64Image);

            response.put("success", true);
            response.put("extractedText", extractedText);
            response.put("message", "Text extracted successfully from camera");
            response.put("processingTime", "< 2 seconds");

            logger.info("Camera text extraction successful");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error during camera text extraction: " + e.getMessage());

            response.put("success", false);
            response.put("extractedText", "");
            response.put("message", "Error extracting text from camera: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/health")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "SnapTalk OCR Service");
        response.put("message", "Service is running successfully");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}
package com.snaptalk.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.logging.Logger;

@Service
public class OCRService {

    private static final Logger logger = Logger.getLogger(OCRService.class.getName());
    private final Tesseract tesseract;

    public OCRService() {
        tesseract = new Tesseract();

        // Try to set Tesseract data path
        try {
            // For Windows, try common installation paths
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                // Try common Windows paths
                tesseract.setDatapath("C:\\Program Files\\Tesseract-OCR\\tessdata");
            } else if (os.contains("mac")) {
                // Try common macOS paths
                tesseract.setDatapath("/usr/local/share/tessdata");
            } else {
                // Try common Linux paths
                tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata");
            }
        } catch (Exception e) {
            logger.warning("Could not set custom tessdata path, using default: " + e.getMessage());
        }

        // Set language to English
        tesseract.setLanguage("eng");

        // Configure OCR settings for better accuracy
        tesseract.setPageSegMode(1);
        tesseract.setOcrEngineMode(1);

        logger.info("OCR Service initialized successfully");
    }

    public String extractTextFromImage(MultipartFile file) throws IOException, TesseractException {
        logger.info("Starting text extraction from image: " + file.getOriginalFilename());

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Convert MultipartFile to BufferedImage
        BufferedImage image;
        try (InputStream inputStream = file.getInputStream()) {
            image = ImageIO.read(inputStream);
            if (image == null) {
                throw new IOException("Could not read image file");
            }
        }

        // Perform OCR
        long startTime = System.currentTimeMillis();
        String extractedText = tesseract.doOCR(image);
        long endTime = System.currentTimeMillis();

        logger.info("Text extraction completed in " + (endTime - startTime) + " ms");

        // Clean up extracted text
        extractedText = extractedText.trim();
        if (extractedText.isEmpty()) {
            return "No text found in the image. Please try with a clearer image containing text.";
        }

        logger.info("Successfully extracted " + extractedText.length() + " characters");
        return extractedText;
    }

    public String extractTextFromBase64Image(String base64Image) throws IOException, TesseractException {
        logger.info("Starting text extraction from base64 image");

        // Remove data URL prefix if present
        if (base64Image.contains(",")) {
            base64Image = base64Image.split(",")[1];
        }

        // Decode base64 to image
        byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Image);
        BufferedImage image = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));

        if (image == null) {
            throw new IOException("Could not decode base64 image");
        }

        // Perform OCR
        long startTime = System.currentTimeMillis();
        String extractedText = tesseract.doOCR(image);
        long endTime = System.currentTimeMillis();

        logger.info("Text extraction completed in " + (endTime - startTime) + " ms");

        // Clean up extracted text
        extractedText = extractedText.trim();
        if (extractedText.isEmpty()) {
            return "No text found in the image. Please try with a clearer image containing text.";
        }

        logger.info("Successfully extracted " + extractedText.length() + " characters");
        return extractedText;
    }
}
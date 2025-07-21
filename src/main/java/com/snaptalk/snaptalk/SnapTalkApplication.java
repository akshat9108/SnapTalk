package com.snaptalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SnapTalkApplication {

	public static void main(String[] args) {
		SpringApplication.run(SnapTalkApplication.class, args);
		System.out.println("===========================================");
		System.out.println("    SnapTalk OCR Application Started!     ");
		System.out.println("    Open: http://localhost:8080           ");
		System.out.println("===========================================");
	}

}
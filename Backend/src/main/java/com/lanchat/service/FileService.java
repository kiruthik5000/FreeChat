package com.lanchat.service;


import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.stream.Stream;

@Service

public class FileService {

    private final Path uploadsRoot = Paths.get("uploads").toAbsolutePath().normalize();

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Kolkata")
    public void deletePreviousDayFolders() {
        LocalDate today = LocalDate.now();

        try {
            if (!Files.exists(uploadsRoot) || !Files.isDirectory(uploadsRoot)) {
                return;
            }

            try (Stream<Path> folders = Files.list(uploadsRoot)) {
                folders.filter(Files::isDirectory)
                        .forEach(folder -> {
                            String folderName = folder.getFileName().toString();

                            try {
                                LocalDate folderDate = LocalDate.parse(folderName);

                                if (folderDate.isBefore(today)) {
                                    deleteDirectoryRecursively(folder);
                                    System.out.println("Deleted old folder: " + folder);
                                }

                            } catch (DateTimeParseException e) {
                                System.out.println("Skipping non-date folder: " + folderName);
                            } catch (IOException e) {
                                System.err.println("Failed to delete folder: " + folder + " - " + e.getMessage());
                            }
                        });
            }

        } catch (IOException e) {
            System.err.println("Error while scanning uploads directory: " + e.getMessage());
        }
    }

    private void deleteDirectoryRecursively(Path dir) throws IOException {
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to delete: " + path, e);
                        }
                    });
        }
    }

}

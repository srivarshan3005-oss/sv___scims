package com.scims.config;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class AppConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();
        mapper.getConfiguration().setSkipNullEnabled(true);
        return mapper;
    }

    /**
     * Serve uploaded files at /uploads/** under the /api context-path.
     * Full URL: http://localhost:8080/api/uploads/complaints/abc.jpg
     *
     * The resource location must be an absolute file: URI so Spring can
     * resolve it correctly regardless of the working directory.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadAbsPath = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize()
                .toString();

        // Ensure trailing separator for Spring resource resolution
        if (!uploadAbsPath.endsWith("/") && !uploadAbsPath.endsWith("\\")) {
            uploadAbsPath += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadAbsPath);
    }
}

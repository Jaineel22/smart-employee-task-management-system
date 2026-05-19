package com.ncode.smarttask.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // Generate Token
    public String generateToken(
            String email
    ) {

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + jwtExpiration
                        )
                )
                .signWith(
                        getSignInKey(),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

    // Extract Username
    public String extractUsername(
            String token
    ) {

        return extractAllClaims(token)
                .getSubject();
    }

    // Validate Token
    public boolean isTokenValid(
            String token,
            String email
    ) {

        final String username =
                extractUsername(token);

        return username.equals(email);
    }

    // Extract Claims
    private Claims extractAllClaims(
            String token
    ) {

        return Jwts.parserBuilder()
                .setSigningKey(
                        getSignInKey()
                )
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Secret Key
    private Key getSignInKey() {

        return Keys.hmacShaKeyFor(
                secretKey.getBytes(
                        StandardCharsets.UTF_8
                )
        );
    }
}
package com.esprit.messaging.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Associe la session WebSocket à un userId passé en query param (?userId=123).
 * Permet le routage des messages de signalisation WebRTC vers le bon utilisateur.
 */
public class UserIdHandshakeHandler extends DefaultHandshakeHandler {

    private static final Pattern USER_ID_PARAM = Pattern.compile("(?:^|&)userId=([^&]+)");

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String query = request.getURI().getQuery();
        if (query == null) return null;
        var matcher = USER_ID_PARAM.matcher(query);
        if (!matcher.find()) return null;
        String userId = matcher.group(1).trim();
        if (userId.isEmpty()) return null;
        return () -> userId;
    }
}

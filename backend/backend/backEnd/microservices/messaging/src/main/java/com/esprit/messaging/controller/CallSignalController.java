package com.esprit.messaging.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * Signalisation WebRTC sur le WebSocket existant.
 * Types: CALL_INVITE, CALL_ACCEPT, CALL_REJECT, CALL_END, RTC_OFFER, RTC_ANSWER, RTC_ICE.
 * Chaque message est routé uniquement vers toUserId.
 * Si le destinataire est hors ligne -> envoie CALL_REJECT (reason=OFFLINE) à l'expéditeur.
 */
@Controller
public class CallSignalController {

    private static final Logger log = LoggerFactory.getLogger(CallSignalController.class);

    private static final String QUEUE_CALL = "/queue/call";
    private static final String TYPE_CALL_REJECT = "CALL_REJECT";
    private static final String REASON_OFFLINE = "OFFLINE";

    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry userRegistry;

    public CallSignalController(SimpMessagingTemplate messagingTemplate, SimpUserRegistry userRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.userRegistry = userRegistry;
    }

    @MessageMapping("/call.signal")
    public void handleCallSignal(@Payload Map<String, Object> message) {
        try {
            String type = getString(message, "type");
            String callId = getString(message, "callId");
            Long fromUserId = getLong(message, "fromUserId");
            Long toUserId = getLong(message, "toUserId");
            Object payload = message.get("payload");
            Object timestamp = message.get("timestamp");

            if (type == null || fromUserId == null || toUserId == null) {
                log.warn("[call.signal] Message invalide: type ou fromUserId ou toUserId manquant");
                return;
            }

            log.debug("[call.signal] type={} callId={} from={} to={}", type, callId, fromUserId, toUserId);

            String toUserPrincipal = String.valueOf(toUserId);
            SimpUser toUser = userRegistry.getUser(toUserPrincipal);

            if (toUser == null) {
                log.info("[call.signal] Destinataire {} hors ligne, envoi CALL_REJECT à {}", toUserId, fromUserId);
                Map<String, Object> reject = Map.of(
                    "type", TYPE_CALL_REJECT,
                    "callId", callId != null ? callId : "",
                    "fromUserId", toUserId,
                    "toUserId", fromUserId,
                    "payload", Map.of("reason", REASON_OFFLINE),
                    "timestamp", timestamp != null ? timestamp : System.currentTimeMillis()
                );
                messagingTemplate.convertAndSendToUser(String.valueOf(fromUserId), QUEUE_CALL, reject);
                return;
            }

            messagingTemplate.convertAndSendToUser(toUserPrincipal, QUEUE_CALL, message);
        } catch (Exception e) {
            log.error("[call.signal] Erreur: {}", e.getMessage());
        }
    }

    private static String getString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private static Long getLong(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        try {
            return Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

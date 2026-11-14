package com.qlpt.backend.service.impl;

import com.qlpt.backend.config.ChatWebSocketHandler;
import com.qlpt.backend.dto.chat.ChatRoomResponse;
import com.qlpt.backend.dto.chat.MessageRequest;
import com.qlpt.backend.dto.chat.MessageResponse;
import com.qlpt.backend.dto.room.RoomResponse;
import com.qlpt.backend.dto.user.UserResponse;
import com.qlpt.backend.entity.*;
import com.qlpt.backend.enums.ContractStatus;
import com.qlpt.backend.enums.Role;
import com.qlpt.backend.exception.ResourceNotFoundException;
import com.qlpt.backend.repository.*;
import com.qlpt.backend.service.ChatService;
import com.qlpt.backend.service.NotificationService;
import com.qlpt.backend.service.PushNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final MessageRepository messageRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PushNotificationService pushNotificationService;

    public ChatServiceImpl(ChatRoomRepository chatRoomRepository,
                           ChatRoomMemberRepository chatRoomMemberRepository,
                           MessageRepository messageRepository,
                           ChatWebSocketHandler chatWebSocketHandler,
                           ContractRepository contractRepository,
                           UserRepository userRepository,
                           NotificationService notificationService,
                           PushNotificationService pushNotificationService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatRoomMemberRepository = chatRoomMemberRepository;
        this.messageRepository = messageRepository;
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.contractRepository = contractRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.pushNotificationService = pushNotificationService;
    }

    @Override
    public ChatRoom getOrCreateChatRoomBetweenUsers(User landlord, User tenant) {
        Optional<ChatRoom> existingRoom = chatRoomRepository.findChatRoomBetweenUsers(landlord, tenant);
        if (existingRoom.isPresent()) {
            return existingRoom.get();
        }

        ChatRoom chatRoom = ChatRoom.builder()
                .room(null)
                .contract(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);

        // Add Landlord as member
        ChatRoomMember landlordMember = ChatRoomMember.builder()
                .chatRoom(savedRoom)
                .user(landlord)
                .joinedAt(LocalDateTime.now())
                .build();
        chatRoomMemberRepository.save(landlordMember);

        // Add Tenant as member
        ChatRoomMember tenantMember = ChatRoomMember.builder()
                .chatRoom(savedRoom)
                .user(tenant)
                .joinedAt(LocalDateTime.now())
                .build();
        chatRoomMemberRepository.save(tenantMember);

        return savedRoom;
    }

    @Transactional
    @Override
    public ChatRoom getOrCreateChatRoom(Contract contract) {
        User landlord = contract.getRoom().getBoardingHouse().getLandlord();
        User tenant = contract.getTenant();
        return getOrCreateChatRoomBetweenUsers(landlord, tenant);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<ChatRoomResponse> getChatRooms(User user, Pageable pageable) {
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Page<ChatRoom> rooms = chatRoomRepository.findByUserOrderByUpdatedAtDesc(currentUser, pageable);
        return rooms.map(room -> {
            // Get last message
            Page<Message> lastMessagePage = messageRepository.findByChatRoomOrderByCreatedAtDesc(room, PageRequest.of(0, 1));
            String lastMessage = "";
            LocalDateTime lastMessageTime = room.getUpdatedAt();
            if (!lastMessagePage.isEmpty()) {
                Message msg = lastMessagePage.getContent().get(0);
                lastMessage = msg.getContent();
                lastMessageTime = msg.getCreatedAt();
            }

            // Get unread count
            long unreadCount = messageRepository.countByChatRoomAndSenderNotAndIsReadFalse(room, currentUser);

            // Find members to identify tenant and landlord
            List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoom(room);
            User tenantUser = members.stream()
                    .map(ChatRoomMember::getUser)
                    .filter(u -> u.getRole() == Role.TENANT)
                    .findFirst()
                    .orElse(null);

            User landlordUser = members.stream()
                    .map(ChatRoomMember::getUser)
                    .filter(u -> u.getRole() == Role.LANDLORD)
                    .findFirst()
                    .orElse(null);

            return new ChatRoomResponse(
                    room.getId(),
                    tenantUser != null ? UserResponse.fromEntityLight(tenantUser) : null,
                    landlordUser != null ? UserResponse.fromEntityLight(landlordUser) : null,
                    room.getCreatedAt(),
                    room.getUpdatedAt(),
                    lastMessage,
                    lastMessageTime,
                    unreadCount
            );
        });
    }

    @Transactional(readOnly = true)
    @Override
    public Page<MessageResponse> getRoomMessages(UUID roomId, User user, Pageable pageable) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chat"));

        if (!chatRoomMemberRepository.existsByChatRoomAndUser(chatRoom, user)) {
            throw new RuntimeException("Bạn không có quyền truy cập cuộc trò chuyện này");
        }

        Page<Message> messages = messageRepository.findByChatRoomOrderByCreatedAtDesc(chatRoom, pageable);
        return messages.map(MessageResponse::fromEntity);
    }

    @Transactional
    @Override
    public MessageResponse sendMessage(UUID roomId, User user, MessageRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chat"));

        if (!chatRoomMemberRepository.existsByChatRoomAndUser(chatRoom, user)) {
            throw new RuntimeException("Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này");
        }

        Message message = Message.builder()
                .chatRoom(chatRoom)
                .sender(user)
                .content(request.content())
                .type(request.type() != null ? request.type() : "TEXT")
                .mediaUrl(request.mediaUrl())
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update room's updatedAt timestamp
        chatRoom.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(chatRoom);

        // Convert to response DTO
        MessageResponse response = MessageResponse.fromEntity(savedMessage);

        // Push real-time messages to all members of the chat room
        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoom(chatRoom);
        for (ChatRoomMember member : members) {
            // Push message via WebSocket
            chatWebSocketHandler.sendMessageToUser(member.getUser().getUsername(), response);

            // Gửi thông báo đẩy nếu không phải là người gửi tin nhắn
            if (!member.getUser().getId().equals(user.getId())) {
                try {
                    String title = "Tin nhắn mới từ " + user.getFullName();
                    String contentText = request.content();
                    if ("IMAGE".equals(request.type())) {
                        contentText = "[Hình ảnh]";
                    } else if ("FILE".equals(request.type())) {
                        contentText = "[Tệp tin]";
                    }
                    pushNotificationService.sendPushNotification(member.getUser(), title, contentText, "CHAT_MESSAGE", chatRoom.getId());
                } catch (Exception e) {
                    System.err.println("Lỗi khi gửi thông báo tin nhắn: " + e.getMessage());
                }
            }
        }

        return response;
    }

    @Transactional
    @Override
    public void markAsRead(UUID roomId, User user) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chat"));

        if (!chatRoomMemberRepository.existsByChatRoomAndUser(chatRoom, user)) {
            throw new RuntimeException("Bạn không có quyền truy cập cuộc trò chuyện này");
        }

        messageRepository.markMessagesAsRead(chatRoom, user);
    }
}

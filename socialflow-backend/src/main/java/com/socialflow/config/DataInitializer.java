package com.socialflow.config;

import com.socialflow.entity.*;
import com.socialflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final PostRepository postRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final AIHistoryRepository aiHistoryRepository;
    private final EmailCampaignRepository emailCampaignRepository;
    private final AnalyticsRepository analyticsRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed standard demo User
            User demoUser = User.builder()
                    .name("Alex Johnson")
                    .email("user@socialflow.ai")
                    .password(passwordEncoder.encode("password123"))
                    .phone("+1 (555) 234-5678")
                    .businessName("Bella Italia Group")
                    .businessType("Restaurant Chain")
                    .plan("Professional")
                    .role(Role.USER)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(demoUser);

            // Seed standard demo Admin
            User demoAdmin = User.builder()
                    .name("System Administrator")
                    .email("admin@socialflow.ai")
                    .password(passwordEncoder.encode("adminpassword"))
                    .phone("+1 (555) 999-0000")
                    .businessName("SocialFlow Global")
                    .businessType("Enterprise Platform")
                    .plan("Enterprise")
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(demoAdmin);

            // Seed Restaurant
            Restaurant r1 = Restaurant.builder()
                    .name("Bella Italia Bistro")
                    .category("Italian")
                    .businessType("Fine Dining")
                    .description("Authentic Tuscan dining experience with artisanal pasta and wood-fired pizzas.")
                    .phone("+1 555-0192")
                    .email("contact@bellaitalia.com")
                    .address("742 Evergreen Terrace, Downtown")
                    .owner(demoUser)
                    .status("ACTIVE")
                    .build();
            restaurantRepository.save(r1);

            // Seed Branch
            Branch b1 = Branch.builder()
                    .branchName("Downtown Main Branch")
                    .address("742 Evergreen Terrace")
                    .city("Springfield")
                    .state("IL")
                    .phone("+1 555-0192")
                    .restaurant(r1)
                    .status("ACTIVE")
                    .build();
            branchRepository.save(b1);

            // Seed Post
            Post p1 = Post.builder()
                    .title("Weekend Special Truffle Pasta")
                    .caption("Indulge in our freshly handcrafted tagliatelle with black truffle cream sauce this weekend! 🍝✨")
                    .imageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800")
                    .hashtags("#ItalianFood #TrufflePasta #Foodie #WeekendVibes")
                    .platform(Platform.INSTAGRAM)
                    .restaurant(r1)
                    .branch(b1)
                    .status(PostStatus.PUBLISHED)
                    .build();
            postRepository.save(p1);

            // Seed Scheduled Post
            ScheduledPost sp1 = ScheduledPost.builder()
                    .post(p1)
                    .restaurant(r1)
                    .branch(b1)
                    .platform(Platform.INSTAGRAM)
                    .scheduledDateTime(java.time.LocalDateTime.now().plusDays(2))
                    .timezone("America/New_York")
                    .status(ScheduleStatus.SCHEDULED)
                    .build();
            scheduledPostRepository.save(sp1);

            // Seed AI History
            AIHistory ai1 = AIHistory.builder()
                    .user(demoUser)
                    .restaurant(r1)
                    .contentType(ContentType.Caption)
                    .prompt("Generate a festive holiday promotion caption for wood-fired pizza")
                    .generatedContent("Warm up your holidays with our authentic wood-fired Margherita! 🔥🍕 Get 20% off all artisanal pizzas tonight!")
                    .build();
            aiHistoryRepository.save(ai1);

            // Seed Email Campaign
            EmailCampaign ec1 = EmailCampaign.builder()
                    .campaignName("Exclusive Holiday Tasting Menu Invite")
                    .restaurant(r1)
                    .branch(b1)
                    .audience("VIP Members")
                    .subject("Special Invitation: Chef's 5-Course Winter Tasting Menu")
                    .previewText("Join us for an unforgettable culinary journey this Friday.")
                    .content("Dear VIP Guest, experience our new seasonal dishes paired with fine Tuscan wines.")
                    .ctaText("Reserve Your Table")
                    .ctaLink("https://bellaitalia.com/reserve")
                    .recipientCount(1450)
                    .status(CampaignStatus.SCHEDULED)
                    .build();
            emailCampaignRepository.save(ec1);

            // Seed Analytics
            Analytics an1 = Analytics.builder()
                    .restaurant(r1)
                    .branch(b1)
                    .platform(Platform.INSTAGRAM)
                    .date(LocalDate.now())
                    .reach(45200)
                    .impressions(98400)
                    .likes(6200)
                    .comments(890)
                    .shares(430)
                    .followers(12400)
                    .engagementRate(5.4)
                    .build();
            analyticsRepository.save(an1);
        }
    }
}

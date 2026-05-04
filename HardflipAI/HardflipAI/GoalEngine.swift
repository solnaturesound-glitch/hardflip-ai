import Foundation

// MARK: - GoalEngine
// Calls OpenAI to break a user's goal into actionable, timed steps.
// Each step gets a title, description, and estimated duration in minutes.

final class GoalEngine {

    static let shared = GoalEngine()

    private var apiKey: String {
        // Load from UserDefaults (set during onboarding or settings)
        // Or from Info.plist for production builds
        UserDefaults.standard.string(forKey: "hardflip.openai_api_key") ?? ""
    }

    private let endpoint = URL(string: "https://api.openai.com/v1/chat/completions")!

    private init() {}

    // MARK: - Main Entry Point

    /// Break a goal string into concrete steps using OpenAI.
    func generateSteps(for goal: String) async throws -> [Step] {
        guard !apiKey.isEmpty else {
            throw GoalEngineError.missingAPIKey
        }

        let prompt = buildPrompt(for: goal)
        let response = try await callOpenAI(prompt: prompt)
        let steps = try parseSteps(from: response, goalTitle: goal)
        return scheduleSteps(steps)
    }

    // MARK: - Prompt Engineering

    private func buildPrompt(for goal: String) -> String {
        return """
        You are an elite productivity coach. The user has a goal: "\(goal)"
        
        Break this into 3-7 concrete, actionable steps they need to actually DO right now.
        
        Rules:
        - Steps must be physical, real-world actions (not "think about it" or "plan")
        - Each step should take 2-60 minutes
        - Use aggressive, direct language — no fluff
        - Steps should flow logically and build on each other
        - Assume they're starting RIGHT NOW
        
        Respond ONLY with valid JSON — no markdown, no extra text:
        {
          "steps": [
            {
              "title": "Short action title (max 8 words)",
              "description": "Exactly what to do. Be specific. No vague advice.",
              "estimatedMinutes": 15
            }
          ]
        }
        """
    }

    // MARK: - OpenAI API Call

    private func callOpenAI(prompt: String) async throws -> String {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "model": "gpt-4o-mini",
            "messages": [
                [
                    "role": "system",
                    "content": "You are a relentless productivity coach. You break goals into concrete steps. You respond ONLY with valid JSON."
                ],
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw GoalEngineError.networkError("Invalid response")
        }

        switch httpResponse.statusCode {
        case 200:
            break
        case 401:
            throw GoalEngineError.invalidAPIKey
        case 429:
            throw GoalEngineError.rateLimited
        default:
            throw GoalEngineError.networkError("HTTP \(httpResponse.statusCode)")
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let choices = json["choices"] as? [[String: Any]],
              let first = choices.first,
              let message = first["message"] as? [String: Any],
              let content = message["content"] as? String else {
            throw GoalEngineError.parseError("Unexpected response shape")
        }

        return content
    }

    // MARK: - Response Parsing

    private func parseSteps(from json: String, goalTitle: String) throws -> [Step] {
        guard let data = json.data(using: .utf8),
              let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let stepsArray = parsed["steps"] as? [[String: Any]] else {
            throw GoalEngineError.parseError("Could not parse steps JSON")
        }

        return stepsArray.compactMap { dict -> Step? in
            guard let title = dict["title"] as? String,
                  let description = dict["description"] as? String,
                  let minutes = dict["estimatedMinutes"] as? Int else {
                return nil
            }
            return Step(
                title: title,
                description: description,
                estimatedMinutes: minutes
            )
        }
    }

    // MARK: - Step Scheduling

    /// Assigns scheduled dates to each step based on cumulative time from now.
    private func scheduleSteps(_ steps: [Step]) -> [Step] {
        var scheduled = steps
        var cursor = Date()

        for i in 0..<scheduled.count {
            // Add a small buffer before the first check-in
            let checkInOffset: TimeInterval
            if i == 0 {
                // First step: check in after 2/3 of estimated time
                checkInOffset = TimeInterval(scheduled[i].estimatedMinutes) * 60 * 0.67
            } else {
                // Subsequent steps: start after previous step completes
                checkInOffset = TimeInterval(scheduled[i].estimatedMinutes) * 60 * 0.67
            }

            scheduled[i].scheduledAt = cursor.addingTimeInterval(checkInOffset)

            // Move cursor forward by full step duration
            cursor = cursor.addingTimeInterval(TimeInterval(scheduled[i].estimatedMinutes) * 60)
        }

        // Mark first step as in progress
        if !scheduled.isEmpty {
            scheduled[0].status = .inProgress
        }

        return scheduled
    }

    // MARK: - Fallback (offline/no key)

    /// Generates a simple fallback plan without AI — for demo/offline use.
    func generateFallbackSteps(for goal: String) -> [Step] {
        let templates: [Step] = [
            Step(title: "Commit. Right now.", description: "Stop thinking about it. You're doing this. Write it down on paper if you have to.", estimatedMinutes: 2),
            Step(title: "Gather what you need", description: "Get every physical item, tool, or resource you'll need. Don't start without them.", estimatedMinutes: 10),
            Step(title: "Take the first action", description: "Do the very first physical step. No setup. No planning. Just start.", estimatedMinutes: 20),
            Step(title: "Push through the hard part", description: "This is where most people quit. You don't. Keep moving.", estimatedMinutes: 30),
            Step(title: "Finish and verify", description: "Don't just stop — make sure it's actually done. Check your work.", estimatedMinutes: 10)
        ]
        return scheduleSteps(templates)
    }
}

// MARK: - Errors

enum GoalEngineError: LocalizedError {
    case missingAPIKey
    case invalidAPIKey
    case rateLimited
    case networkError(String)
    case parseError(String)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "No OpenAI API key set. Add it in Settings."
        case .invalidAPIKey:
            return "Invalid API key. Check your key in Settings."
        case .rateLimited:
            return "OpenAI rate limit hit. Wait a minute and try again."
        case .networkError(let msg):
            return "Network error: \(msg)"
        case .parseError(let msg):
            return "Parse error: \(msg)"
        }
    }
}

import Combine
import Models
import Services
import SwiftUI
import Utils
import Views

struct WelcomeView: View {
  @EnvironmentObject var dataService: DataService
  @EnvironmentObject var authenticator: Authenticator
  @Environment(\.horizontalSizeClass) var horizontalSizeClass

  @StateObject private var viewModel = RegistrationViewModel()

  @State private var showRegistrationView = false
  @State private var showDebugModal = false
  @State private var selectedEnvironment = AppEnvironment.initialAppEnvironment
  @State private var containerSize: CGSize = .zero

  func handleHiddenGestureAction() {
    if !Bundle.main.isAppStoreBuild {
      showDebugModal = true
    }
  }

  var headlineText: some View {
    Group {
      if horizontalSizeClass == .compact {
        Text("Everything you read. Safe, organized, and easy to share.")
      } else {
        Text("Everything you read. Safe,\norganized, and easy to share.")
      }
    }
    .font(.appLargeTitle)
  }

  var headlineView: some View {
    VStack(alignment: .leading, spacing: 8) {
      headlineText

      Button(
        action: { print("learn more button tapped") },
        label: {
          HStack(spacing: 4) {
            Text("Learn more")
            Image(systemName: "arrow.right")
          }
          .font(.appTitleThree)
        }
      )
      .foregroundColor(.appGrayTextContrast)
    }
  }

  var footerView: some View {
    Text("By signing up, you agree to Omnivore’s\nTerms of Service and Privacy Policy")
      .font(.appSubheadline)
  }

  var logoView: some View {
    Image.omnivoreTitleLogo
      .gesture(
        TapGesture(count: 2)
          .onEnded {
            if !Bundle.main.isAppStoreBuild {
              showDebugModal = true
            }
          }
      )
  }

  var authProviderButtonStack: some View {
    let buttonGroup = Group {
      AppleSignInButton {
        viewModel.handleAppleSignInCompletion(result: $0, authenticator: authenticator)
      }
      // set maxwidth = 260

      if AppKeys.sharedInstance?.iosClientGoogleId != nil {
        GoogleAuthButton {
          viewModel.handleGoogleAuth(authenticator: authenticator)
        }
      }
    }

    return
      VStack(alignment: .center, spacing: 16) {
        if containerSize.width > 400 {
          HStack { buttonGroup }
        } else {
          buttonGroup
        }

        if let loginError = viewModel.loginError {
          LoginErrorMessageView(loginError: loginError)
        }
      }
  }

  public var body: some View {
    ZStack(alignment: .leading) {
      Color.appDeepBackground
        .edgesIgnoringSafeArea(.all)
        .modifier(SizeModifier())
        .onPreferenceChange(SizePreferenceKey.self) {
          self.containerSize = $0
        }
      if let registrationState = viewModel.registrationState {
        if case let RegistrationViewModel.RegistrationState.createProfile(userProfile) = registrationState {
          CreateProfileView(userProfile: userProfile)
        } else if case let RegistrationViewModel.RegistrationState.newAppleSignUp(userProfile) = registrationState {
          NewAppleSignupView(
            userProfile: userProfile,
            showProfileEditView: { viewModel.registrationState = .createProfile(userProfile: userProfile) }
          )
        } else {
          EmptyView() // will never be called
        }
      } else {
        VStack(alignment: .leading, spacing: containerSize.height < 500 ? 12 : 50) {
          logoView
            .padding(.bottom, 20)
          headlineView
          authProviderButtonStack
          footerView
          Spacer()
        }
        .padding()
      }
    }
    .sheet(isPresented: $showDebugModal) {
      DebugMenuView(selectedEnvironment: $selectedEnvironment)
    }
    .task { selectedEnvironment = dataService.appEnvironment }
  }
}

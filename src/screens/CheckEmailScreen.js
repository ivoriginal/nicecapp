import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';

const [otp, setOtp] = useState('');
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (otp.length === 6 && !loading) {
    verifyOtp();
  }
}, [otp]);

          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: theme.primaryText }]}
            onPress={verifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <Text style={[styles.verifyButtonText, { color: theme.background }]}>Verify Code</Text>
            )}
          </TouchableOpacity>
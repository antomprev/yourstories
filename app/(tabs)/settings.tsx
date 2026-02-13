import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Shield, FileText, Info, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import CachedBackground, { BACKGROUND_IMAGES } from '@/components/CachedBackground';

export default function Settings() {
  const [error, setError] = React.useState<string | null>(null);
  const [childName, setChildName] = React.useState('');
  const [childAge, setChildAge] = React.useState('');
  const [parentName, setParentName] = React.useState('');
  const [storyLanguage, setStoryLanguage] = React.useState('English');
  const [updating, setUpdating] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('child_name, child_age, parent_name, story_language')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (data) {
        setChildName(data.child_name || '');
        setChildAge(data.child_age?.toString() || '');
        setParentName(data.parent_name || '');
        setStoryLanguage(data.story_language || 'English');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const updateProfile = async (updates: {
    child_name?: string;
    child_age?: number | null;
    parent_name?: string;
    story_language?: string;
  }) => {
    try {
      setUpdating(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <CachedBackground uri={BACKGROUND_IMAGES.main} style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.content}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personalize your stories</Text>
                
                <View style={styles.settingCard}>
                  <View style={styles.settingGroup}>
                    <View style={styles.setting}>
                      <View style={styles.settingLeft}>
                        <Text style={styles.settingLabel}>Child's Name</Text>
                      </View>
                      <TextInput
                        style={styles.settingInput}
                        value={childName}
                        onChangeText={(text) => {
                          setChildName(text);
                          updateProfile({ child_name: text });
                        }}
                        placeholder="Enter name"
                        placeholderTextColor="#9CA3AF"
                        editable={!updating}
                      />
                    </View>
                    <Text style={styles.settingHint}>This name will be used in personalized stories</Text>
                  </View>

                  <View style={styles.settingGroup}>
                    <View style={styles.setting}>
                      <View style={styles.settingLeft}>
                        <Text style={styles.settingLabel}>Child's Age</Text>
                      </View>
                      <TextInput
                        style={styles.settingInput}
                        value={childAge}
                        onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9]/g, '');
                          if (numericValue === '' || (parseInt(numericValue, 10) >= 0 && parseInt(numericValue, 10) <= 18)) {
                            setChildAge(numericValue);
                            updateProfile({ 
                              child_age: numericValue ? parseInt(numericValue, 10) : null 
                            });
                          }
                        }}
                        placeholder="Enter age"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={2}
                        editable={!updating}
                      />
                    </View>
                    <Text style={styles.settingHint}>Your child's age for personalized content</Text>
                  </View>

                  <View style={styles.settingGroup}>
                    <View style={styles.setting}>
                      <View style={styles.settingLeft}>
                        <Text style={styles.settingLabel}>Parent Name</Text>
                      </View>
                      <TextInput
                        style={styles.settingInput}
                        value={parentName}
                        onChangeText={(text) => {
                          setParentName(text);
                          updateProfile({ parent_name: text });
                        }}
                        placeholder="Enter name"
                        placeholderTextColor="#9CA3AF"
                        editable={!updating}
                      />
                    </View>
                    <Text style={styles.settingHint}>Your name will appear in personalized stories</Text>
                  </View>

                  <View style={styles.settingGroup}>
                    <View style={styles.setting}>
                      <View style={styles.settingLeft}>
                        <Text style={styles.settingLabel}>Story Language</Text>
                      </View>
                      {Platform.OS === 'web' ? (
                        <select
                          value={storyLanguage}
                          onChange={(e) => {
                            setStoryLanguage(e.target.value);
                            updateProfile({ story_language: e.target.value });
                          }}
                          style={styles.webSelect as any}
                          disabled={updating}
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="Greek">Greek</option>
                        </select>
                      ) : (
                        <Text style={styles.languageSelectorText}>{storyLanguage}</Text>
                      )}
                    </View>
                    <Text style={styles.settingHint}>Choose the language for your stories</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                
                <View style={styles.settingCard}>
                  <TouchableOpacity style={styles.setting}>
                    <View style={styles.settingLeft}>
                      <Shield size={20} color="#4B5563" style={styles.settingIcon} />
                      <Text style={styles.settingLabel}>Privacy Policy</Text>
                    </View>
                    <ChevronRight size={20} color="#6B7280" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.setting}>
                    <View style={styles.settingLeft}>
                      <FileText size={20} color="#4B5563" style={styles.settingIcon} />
                      <Text style={styles.settingLabel}>Terms of Service</Text>
                    </View>
                    <ChevronRight size={20} color="#6B7280" />
                  </TouchableOpacity>

                  <View style={[styles.setting, styles.settingGroupLast]}>
                    <View style={styles.settingLeft}>
                      <Info size={20} color="#4B5563" style={styles.settingIcon} />
                      <Text style={styles.settingLabel}>Version</Text>
                    </View>
                    <Text style={styles.versionText}>1.0.0</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.settingCard}>
                  <TouchableOpacity 
                    style={[styles.setting, styles.settingGroupLast, styles.signOutButton]}
                    onPress={handleSignOut}
                  >
                    <View style={styles.settingLeft}>
                      <LogOut size={20} color="#DC2626" style={styles.settingIcon} />
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </CachedBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Quicksand-Bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  settingGroup: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.8)',
  },
  settingGroupLast: {
    borderBottomWidth: 0,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 120,
    maxWidth: 160,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  settingInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    textAlign: 'right',
    padding: Platform.OS === 'web' ? 8 : 0,
    minWidth: 120,
  },
  settingHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  versionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: 'rgba(254, 226, 226, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  signOutButton: {
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageSelectorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginRight: 8,
  },
  webSelect: {
    fontSize: '16px',
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#ffffff',
    minWidth: 120,
  },
});
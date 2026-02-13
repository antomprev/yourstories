import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wand as Wand2, LogIn, ChevronDown } from 'lucide-react-native';
import { generateStory, type StoryDuration } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import CachedBackground, { BACKGROUND_IMAGES } from '@/components/CachedBackground';

const THEMES = [
  'Adventure & Exploration',
  'Fantasy & Magic',
  'Animals & Nature',
  'Fairy Tales & Folklore',
  'Friendship & Family',
  'Educational & Moral Lessons',
  'Humor & Fun',
  'Science Fiction & Space',
  'Mystery & Detective',
  'Everyday Life & School',
];

const FAMOUS_BOOKS = [
  'Treasure Island',
  'Around the World in Eighty Days',
  'Twenty Thousand Leagues Under the Seas',
  'Journey to the Center of the Earth',
  'The Adventures of Tom Sawyer',
  'The Adventures of Huckleberry Finn',
  'Oliver Twist',
  'The Jungle Book',
  'Robinson Crusoe',
  "Gulliver's Travels",
  'Heidi',
  'Peter Pan',
  'Anne of Green Gables',
  'The Call of the Wild',
  'White Fang',
  'Little Lord Fauntleroy',
  'The Merry Adventures of Robin Hood',
  'Swiss Family Robinson',
  'The Secret Garden',
  'Black Beauty',
];

const DURATIONS: StoryDuration[] = ['Short', 'Standard', 'Long'];

export default function CreateStory() {
  const [age, setAge] = useState('');
  const [duration, setDuration] = useState<StoryDuration>('Standard');
  const [selectedType, setSelectedType] = useState<'theme' | 'book' | 'custom'>('theme');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedBook, setSelectedBook] = useState(FAMOUS_BOOKS[0]);
  const [customStoryBrief, setCustomStoryBrief] = useState('');
  const [isPersonalized, setIsPersonalized] = useState<'Yes' | 'No'>('No');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'theme' | 'book' | 'duration'>('theme');
  const [userProfile, setUserProfile] = useState<{
    child_name: string;
    child_age: number | null;
    parent_name: string;
    story_language: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (isPersonalized === 'Yes' && userProfile?.child_age !== null) {
      setAge(userProfile.child_age.toString());
    } else if (isPersonalized === 'No') {
      setAge('');
    }
  }, [isPersonalized, userProfile?.child_age]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('child_name, child_age, parent_name, story_language')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);
    } catch (err) {
      console.error('Error checking user:', err);
      setError('Failed to check authentication status');
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      setError('Please sign in to generate stories');
      router.replace('/');
      return;
    }

    if (!age || (selectedType === 'custom' && !customStoryBrief)) {
      setError('Please fill in all fields');
      return;
    }

    if (isPersonalized === 'Yes') {
      if (!userProfile?.child_name || !userProfile?.parent_name) {
        setError('Please provide all personalization details in Settings before creating a personalized story');
        return;
      }
      if (userProfile?.child_age === null) {
        setError("Please set your child's age in Settings before creating a personalized story");
        return;
      }
    }

    setError(null);
    setIsGenerating(true);

    try {
      let storyTheme;
      if (selectedType === 'theme') {
        storyTheme = selectedTheme;
      } else if (selectedType === 'book') {
        storyTheme = selectedBook;
      } else {
        storyTheme = customStoryBrief;
      }

      const story = await generateStory(
        isPersonalized === 'Yes' && userProfile?.child_age !== null
          ? userProfile.child_age
          : parseInt(age, 10),
        storyTheme,
        duration,
        isPersonalized === 'Yes',
        userProfile?.child_name || '',
        userProfile?.parent_name || '',
        userProfile?.story_language || 'English'
      );

      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: story.title,
          content: story.content,
          age: isPersonalized === 'Yes' && userProfile?.child_age !== null
            ? userProfile.child_age
            : parseInt(age, 10),
          theme: storyTheme,
          duration: duration,
          icon_url: story.icon_url
        });

      if (insertError) throw insertError;

      setAge('');
      setDuration('Standard');
      setSelectedType('theme');
      setSelectedTheme(THEMES[0]);
      setSelectedBook(FAMOUS_BOOKS[0]);
      setCustomStoryBrief('');
      setIsPersonalized('No');
      router.push('/history');
    } catch (err: any) {
      if (err.message.includes('Story limit reached')) {
        setError('Story generation is temporarily unavailable. Please try again tomorrow.');
      } else {
        setError(err.message || 'Failed to generate story. Please try again.');
      }
      console.error('Story generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSelector = (type: 'theme' | 'book') => {
    const isTheme = type === 'theme';
    const value = isTheme ? selectedTheme : selectedBook;
    const options = isTheme ? THEMES : FAMOUS_BOOKS;
    const isDisabled = isGenerating || selectedType !== type || (type === 'book' && isPersonalized === 'Yes');

    if (Platform.OS === 'web') {
      return (
        <select
          value={value}
          onChange={(e) => {
            if (isTheme) {
              setSelectedTheme(e.target.value);
            } else {
              setSelectedBook(e.target.value);
            }
          }}
          disabled={isDisabled}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontFamily: 'Inter-Regular',
            color: isDisabled ? '#9CA3AF' : '#1F2937',
            backgroundColor: isDisabled ? 'rgba(243, 244, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${isDisabled ? 'rgba(229, 231, 235, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
            borderRadius: '12px',
            appearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            backgroundSize: '12px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.selectorButton,
          isDisabled && styles.selectorButtonDisabled,
        ]}
        onPress={() => {
          if (!isDisabled) {
            setPickerType(type);
            setShowPicker(true);
          }
        }}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.selectorButtonText,
            isDisabled && styles.selectorButtonTextDisabled,
          ]}
        >
          {value}
        </Text>
        <ChevronDown
          size={20}
          color={isDisabled ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <CachedBackground uri={BACKGROUND_IMAGES.main} style={styles.backgroundImage}>
        <View style={styles.overlay}>
          <SafeAreaView style={[styles.container, styles.elevatedContainer]}>
            <View style={styles.header}>
              <Text style={styles.title}>Create a Story</Text>
              <Text style={styles.subtitle}>Please sign in to continue</Text>
            </View>
            <View style={styles.signInContainer}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => router.replace('/')}
              >
                <LogIn size={24} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </CachedBackground>
    );
  }

  return (
    <CachedBackground uri={BACKGROUND_IMAGES.main} style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, styles.elevatedContainer]}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={styles.title}>Create a Story</Text>
              <Text style={styles.subtitle}>
                Fill in the details below to generate a unique story for your child
              </Text>
            </View>

            <View style={styles.form}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Personalized Story</Text>
                <View style={styles.segmentedControl}>
                  {['Yes', 'No'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.segmentButton,
                        isPersonalized === option && styles.segmentButtonActive,
                      ]}
                      onPress={() => setIsPersonalized(option as 'Yes' | 'No')}
                      disabled={isGenerating}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          isPersonalized === option && styles.segmentButtonTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.rowContainer}>
                <View style={styles.halfInputGroup}>
                  <Text style={[styles.label, isPersonalized === 'Yes' && styles.labelDisabled]}>Age</Text>
                  <View style={[
                    styles.ageInputContainer,
                    isPersonalized === 'Yes' && styles.ageInputContainerDisabled
                  ]}>
                    <TextInput
                      style={[
                        styles.input,
                        isPersonalized === 'Yes' && styles.inputDisabled
                      ]}
                      value={age}
                      onChangeText={setAge}
                      placeholder="Years"
                      placeholderTextColor={isPersonalized === 'Yes' ? 'rgba(156, 163, 175, 0.5)' : 'rgba(156, 163, 175, 0.9)'}
                      keyboardType="number-pad"
                      maxLength={2}
                      editable={!isGenerating && isPersonalized === 'No'}
                    />
                  </View>
                </View>

                <View style={styles.halfInputGroup}>
                  <Text style={styles.label}>Duration</Text>
                  {Platform.OS === 'web' ? (
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value as StoryDuration)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '16px',
                        fontFamily: 'Inter-Regular',
                        color: '#1F2937',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                        backgroundSize: '12px',
                      }}
                    >
                      {DURATIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <TouchableOpacity
                      style={styles.selectorButton}
                      onPress={() => {
                        setPickerType('duration');
                        setShowPicker(true);
                      }}
                    >
                      <Text style={styles.selectorButtonText}>
                        {duration}
                      </Text>
                      <ChevronDown size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Story Source</Text>
                <View style={styles.segmentedControl}>
                  {['theme', 'custom', 'book'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.segmentButton,
                        selectedType === type && styles.segmentButtonActive,
                        type === 'book' && isPersonalized === 'Yes' && styles.segmentButtonDisabled,
                      ]}
                      onPress={() => setSelectedType(type as 'theme' | 'book' | 'custom')}
                      disabled={isGenerating || (type === 'book' && isPersonalized === 'Yes')}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          selectedType === type && styles.segmentButtonTextActive,
                          type === 'book' && isPersonalized === 'Yes' && styles.segmentButtonTextDisabled,
                        ]}
                      >
                        {type === 'theme' ? 'Theme' :
                         type === 'custom' ? 'Custom' :
                         'Book'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                {selectedType === 'custom' ? (
                  <>
                    <Text style={styles.label}>Story Brief</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={customStoryBrief}
                      onChangeText={setCustomStoryBrief}
                      placeholder="Describe your story idea briefly..."
                      placeholderTextColor="rgba(156, 163, 175, 0.9)"
                      multiline
                      numberOfLines={4}
                      editable={!isGenerating}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>
                      {selectedType === 'theme' ? 'Select Theme' : 'Select Book'}
                    </Text>
                    {renderSelector(selectedType as 'theme' | 'book')}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.generateButton,
                  (!age || (selectedType === 'custom' && !customStoryBrief) || isGenerating) && 
                  styles.generateButtonDisabled,
                ]}
                onPress={handleGenerate}
                disabled={!age || (selectedType === 'custom' && !customStoryBrief) || isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Wand2 size={24} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.generateButtonText}>Generate Story</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {Platform.OS !== 'web' && showPicker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>
                    {pickerType === 'theme' ? 'Select Theme' :
                     pickerType === 'book' ? 'Select Book' :
                     'Select Duration'}
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={
                    pickerType === 'theme' ? selectedTheme :
                    pickerType === 'book' ? selectedBook :
                    duration
                  }
                  onValueChange={(itemValue) => {
                    if (pickerType === 'theme') {
                      setSelectedTheme(itemValue);
                    } else if (pickerType === 'book') {
                      setSelectedBook(itemValue);
                    } else {
                      setDuration(itemValue as StoryDuration);
                    }
                    setShowPicker(false);
                  }}
                >
                  {(pickerType === 'theme' ? THEMES :
                    pickerType === 'book' ? FAMOUS_BOOKS :
                    DURATIONS).map((option) => (
                    <Picker.Item
                      key={option}
                      label={option}
                      value={option}
                      color="#1F2937"
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}
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
  elevatedContainer: {
    marginTop: '5%',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Quicksand-Bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  form: {
    padding: 24,
    margin: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
  inputGroup: {
    marginBottom: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  halfInputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelDisabled: {
    opacity: 0.6,
  },
  ageInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ageInputContainerDisabled: {
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    borderColor: 'rgba(229, 231, 235, 0.2)',
    opacity: 0.6,
  },
  input: {
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputDisabled: {
    color: '#9CA3AF',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.2)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonDisabled: {
    opacity: 0.6,
  },
  segmentButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  segmentButtonTextActive: {
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
    textShadowColor: 'transparent',
  },
  segmentButtonTextDisabled: {
    opacity: 0.6,
  },
  selectorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorButtonDisabled: {
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    borderColor: 'rgba(229, 231, 235, 0.2)',
    opacity: 0.6,
  },
  selectorButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  selectorButtonTextDisabled: {
    color: '#9CA3AF',
  },
  generateButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  pickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  pickerDoneButton: {
    padding: 8,
  },
  pickerDoneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },
});
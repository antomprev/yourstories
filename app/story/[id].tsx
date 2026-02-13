import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { textToSpeech } from '@/lib/openai';
import { ArrowLeft, Play, Pause, Square } from 'lucide-react-native';
import CachedBackground, { BACKGROUND_IMAGES } from '@/components/CachedBackground';
import { Image } from 'expo-image';

interface Story {
  story_id: string;
  title: string;
  content: string;
  age: number;
  duration: string;
  created_at: string;
  audio_url?: string;
  icon_url?: string;
}

export default function StoryDetail() {
  const { id } = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadStory();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [id]);

  const loadStory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view this story');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('story_id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Story not found');
        return;
      }

      setStory(data);
    } catch (err) {
      setError('Failed to load story');
      console.error('Error loading story:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async () => {
    if (Platform.OS !== 'web' || !story) return;

    if (isReading) {
      if (audioRef.current) {
        if (isPaused) {
          audioRef.current.play();
          setIsPaused(false);
        } else {
          audioRef.current.pause();
          setIsPaused(true);
        }
      }
      return;
    }

    try {
      let audioUrl = story.audio_url;

      if (!audioUrl) {
        setIsGeneratingAudio(true);
        audioUrl = await textToSpeech(story.content);
        
        const { error: updateError } = await supabase
          .from('stories')
          .update({ audio_url: audioUrl })
          .eq('story_id', story.story_id);

        if (updateError) throw updateError;
        
        setStory({ ...story, audio_url: audioUrl });
      }
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsReading(false);
        setIsPaused(false);
        audioRef.current = null;
      };
      
      audioRef.current = audio;
      audio.play();
      setIsReading(true);
      setIsPaused(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsReading(false);
      setIsPaused(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !story) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Story not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CachedBackground uri={BACKGROUND_IMAGES.story} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color="#1F2937" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <View style={styles.audioControls}>
                <TouchableOpacity
                  onPress={handleRead}
                  style={[
                    styles.readButton,
                    isReading && styles.readButtonActive,
                    (isGeneratingAudio || !story) && styles.readButtonDisabled
                  ]}
                  disabled={isGeneratingAudio || !story}
                >
                  {isGeneratingAudio ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : isReading ? (
                    isPaused ? (
                      <Play size={20} color="#ffffff" fill="#ffffff" />
                    ) : (
                      <Pause size={20} color="#ffffff" />
                    )
                  ) : (
                    <Play size={20} color="#ffffff" fill="#ffffff" />
                  )}
                  <Text style={styles.readButtonText}>
                    {isGeneratingAudio 
                      ? 'Generating Audio...' 
                      : isReading 
                        ? isPaused 
                          ? 'Resume' 
                          : 'Pause' 
                        : 'Read Story'
                    }
                  </Text>
                </TouchableOpacity>
                {isReading && (
                  <TouchableOpacity
                    onPress={handleStop}
                    style={styles.stopButton}
                  >
                    <Square size={20} color="#ffffff" />
                    <Text style={styles.readButtonText}>Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <Text style={styles.title}>{story.title}</Text>
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>Age: {story.age}</Text>
            <Text style={styles.metadataText}>•</Text>
            <Text style={styles.metadataText}>{story.duration}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {story.icon_url && (
              <View style={styles.iconContainer}>
                <Image
                  source={{ uri: story.icon_url }}
                  style={[styles.storyIcon, styles.storyIconImage]}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
              </View>
            )}
            <Text style={styles.storyText}>{story.content}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CachedBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 0.85)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 250, 251, 0.85)',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.8)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  audioControls: {
    flexDirection: 'row',
    gap: 8,
  },
  readButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  readButtonActive: {
    backgroundColor: '#7C3AED',
  },
  readButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  stopButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  readButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  content: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 24,
    borderRadius: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  storyIcon: {
    width: 200,
    height: 200,
  },
  storyIconImage: {
    borderRadius: 16,
  },
  storyText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 28,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
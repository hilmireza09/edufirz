export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          assignment_id: string
          deleted_at: string | null
          feedback: string | null
          file_name: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          status: string | null
          student_id: string
          submission_text: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          deleted_at?: string | null
          feedback?: string | null
          file_name?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: string | null
          student_id: string
          submission_text?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          deleted_at?: string | null
          feedback?: string | null
          file_name?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: string | null
          student_id?: string
          submission_text?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "class_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_announcements: {
        Row: {
          author_id: string
          class_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          title: string
        }
        Insert: {
          author_id: string
          class_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          class_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_assignments: {
        Row: {
          class_id: string
          created_at: string | null
          deleted_at: string | null
          description: string
          due_date: string | null
          id: string
          max_points: number | null
          quiz_id: string | null
          status: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          deleted_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          max_points?: number | null
          quiz_id?: string | null
          status?: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          max_points?: number | null
          quiz_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          id: string
          joined_at: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          join_code: string
          name: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code: string
          name: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string
          name?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          difficulty: string | null
          enrollment_count: number | null
          id: string
          instructor_id: string
          is_published: boolean | null
          price: number | null
          rating: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          difficulty?: string | null
          enrollment_count?: number | null
          id?: string
          instructor_id: string
          is_published?: boolean | null
          price?: number | null
          rating?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          difficulty?: string | null
          enrollment_count?: number | null
          id?: string
          instructor_id?: string
          is_published?: boolean | null
          price?: number | null
          rating?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          flashcard_count: number | null
          id: string
          is_public: boolean | null
          last_modified_by_admin: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          flashcard_count?: number | null
          id?: string
          is_public?: boolean | null
          last_modified_by_admin?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          flashcard_count?: number | null
          id?: string
          is_public?: boolean | null
          last_modified_by_admin?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_last_modified_by_admin_fkey"
            columns: ["last_modified_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string | null
          deck_id: string
          deleted_at: string | null
          front: string
          hint: string | null
          id: string
          image_url: string | null
          last_modified_by_admin: string | null
          position: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          back: string
          created_at?: string | null
          deck_id: string
          deleted_at?: string | null
          front: string
          hint?: string | null
          id?: string
          image_url?: string | null
          last_modified_by_admin?: string | null
          position?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          back?: string
          created_at?: string | null
          deck_id?: string
          deleted_at?: string | null
          front?: string
          hint?: string | null
          id?: string
          image_url?: string | null
          last_modified_by_admin?: string | null
          position?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_last_modified_by_admin_fkey"
            columns: ["last_modified_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
          vote_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_pinned: boolean | null
          is_solved: boolean | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          votes: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_solved?: boolean | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          votes?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_solved?: boolean | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_solution: boolean | null
          post_id: string
          updated_at: string | null
          votes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_solution?: boolean | null
          post_id: string
          updated_at?: string | null
          votes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_solution?: boolean | null
          post_id?: string
          updated_at?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reply_votes: {
        Row: {
          created_at: string | null
          id: string
          reply_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reply_id: string
          user_id: string
          vote_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reply_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reply_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_data_collection: boolean | null
          auto_play_media: boolean | null
          avatar_url: string | null
          class_updates: boolean | null
          created_at: string | null
          deleted_at: string | null
          digest_frequency: string | null
          email: string | null
          email_notifications: boolean | null
          flashcard_review_interval: string | null
          forum_replies: boolean | null
          full_name: string | null
          id: string
          preferred_learning_style: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          quiz_reminders: boolean | null
          quiz_timer: boolean | null
          role: string | null
          share_progress: boolean | null
          show_hints: boolean | null
          show_online_status: boolean | null
          subscription_tier: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          allow_data_collection?: boolean | null
          auto_play_media?: boolean | null
          avatar_url?: string | null
          class_updates?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          digest_frequency?: string | null
          email?: string | null
          email_notifications?: boolean | null
          flashcard_review_interval?: string | null
          forum_replies?: boolean | null
          full_name?: string | null
          id: string
          preferred_learning_style?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          quiz_reminders?: boolean | null
          quiz_timer?: boolean | null
          role?: string | null
          share_progress?: boolean | null
          show_hints?: boolean | null
          show_online_status?: boolean | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_data_collection?: boolean | null
          auto_play_media?: boolean | null
          avatar_url?: string | null
          class_updates?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          digest_frequency?: string | null
          email?: string | null
          email_notifications?: boolean | null
          flashcard_review_interval?: string | null
          forum_replies?: boolean | null
          full_name?: string | null
          id?: string
          preferred_learning_style?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          quiz_reminders?: boolean | null
          quiz_timer?: boolean | null
          role?: string | null
          share_progress?: boolean | null
          show_hints?: boolean | null
          show_online_status?: boolean | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          max_score: number | null
          quiz_id: string
          score: number | null
          time_taken: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_score?: number | null
          quiz_id: string
          score?: number | null
          time_taken?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_score?: number | null
          quiz_id?: string
          score?: number | null
          time_taken?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          deleted_at: string | null
          explanation: string | null
          id: string
          options: string[] | null
          order_index: number | null
          points: number | null
          question: string
          quiz_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          deleted_at?: string | null
          explanation?: string | null
          id?: string
          options?: string[] | null
          order_index?: number | null
          points?: number | null
          question: string
          quiz_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          deleted_at?: string | null
          explanation?: string | null
          id?: string
          options?: string[] | null
          order_index?: number | null
          points?: number | null
          question?: string
          quiz_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          attempts_allowed: number | null
          category: string | null
          course_id: string | null
          created_at: string | null
          creator_id: string
          deleted_at: string | null
          description: string | null
          difficulty: string | null
          due_date: string | null
          id: string
          is_public: boolean | null
          status: string
          time_limit: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attempts_allowed?: number | null
          category?: string | null
          course_id?: string | null
          created_at?: string | null
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          id?: string
          is_public?: boolean | null
          status?: string
          time_limit?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attempts_allowed?: number | null
          category?: string | null
          course_id?: string | null
          created_at?: string | null
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          id?: string
          is_public?: boolean | null
          status?: string
          time_limit?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_analytics: {
        Row: {
          activity_type: string | null
          created_at: string | null
          deleted_at: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          session_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          session_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          session_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          performed_by: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

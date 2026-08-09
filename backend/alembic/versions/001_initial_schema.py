"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-08 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email_hash', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email_hash'), 'users', ['email_hash'], unique=True)

    # Profiles
    op.create_table(
        'profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('display_name', sa.String(length=64), nullable=False),
        sa.Column('avatar_seed', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_profiles_display_name'), 'profiles', ['display_name'], unique=True)

    # Questionnaire Responses
    op.create_table(
        'questionnaire_responses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('addiction_type', sa.String(length=64), nullable=False),
        sa.Column('onset_description', sa.Text(), nullable=True),
        sa.Column('frequency', sa.String(length=32), nullable=False),
        sa.Column('awareness_date', sa.String(length=32), nullable=True),
        sa.Column('disclosed_to_others', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('knows_similar_others', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('feature_vector', sa.JSON(), nullable=True),
        sa.Column('matched', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_questionnaire_responses_addiction_type'), 'questionnaire_responses', ['addiction_type'], unique=False)
    op.create_index(op.f('ix_questionnaire_responses_matched'), 'questionnaire_responses', ['matched'], unique=False)

    # Chatrooms
    op.create_table(
        'chatrooms',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('addiction_type', sa.String(length=64), nullable=False),
        sa.Column('is_general', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chatrooms_addiction_type'), 'chatrooms', ['addiction_type'], unique=False)

    # Chatroom Members
    op.create_table(
        'chatroom_members',
        sa.Column('chatroom_id', sa.String(length=36), nullable=False),
        sa.Column('profile_id', sa.String(length=36), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['chatroom_id'], ['chatrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('chatroom_id', 'profile_id')
    )

    # Messages
    op.create_table(
        'messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('chatroom_id', sa.String(length=36), nullable=False),
        sa.Column('profile_id', sa.String(length=36), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['chatroom_id'], ['chatrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_chatroom_id'), 'messages', ['chatroom_id'], unique=False)
    op.create_index(op.f('ix_messages_profile_id'), 'messages', ['profile_id'], unique=False)
    op.create_index(op.f('ix_messages_sent_at'), 'messages', ['sent_at'], unique=False)

    # Sobriety Logs
    op.create_table(
        'sobriety_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('event_type', sa.String(length=32), nullable=False),
        sa.Column('event_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sobriety_logs_user_id'), 'sobriety_logs', ['user_id'], unique=False)

    # Daily Tasks
    op.create_table(
        'daily_tasks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('task_text', sa.Text(), nullable=False),
        sa.Column('addiction_type', sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_tasks_addiction_type'), 'daily_tasks', ['addiction_type'], unique=False)

    # User Task Completions
    op.create_table(
        'user_task_completions',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('task_id', sa.String(length=36), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['daily_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'task_id')
    )

    # SOS Events
    op.create_table(
        'sos_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('chatroom_id', sa.String(length=36), nullable=False),
        sa.Column('level', sa.String(length=32), nullable=False),
        sa.Column('triggered_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['chatroom_id'], ['chatrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('sos_events')
    op.drop_table('user_task_completions')
    op.drop_table('daily_tasks')
    op.drop_table('sobriety_logs')
    op.drop_table('messages')
    op.drop_table('chatroom_members')
    op.drop_table('chatrooms')
    op.drop_table('questionnaire_responses')
    op.drop_table('profiles')
    op.drop_table('users')

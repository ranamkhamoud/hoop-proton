import pickle
from datetime import datetime, timedelta
from django.conf import settings
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from django.shortcuts import get_object_or_404
import json
from django.urls import reverse
from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
from .forms import UserForm, ProfileForm, UserEditForm, PlayerEditForm, EventForm
from .models import Player, Coach, Manager, CanvasImage
from .utils import *
from django.shortcuts import render, redirect
from .models import *
from django.db.models import Subquery, OuterRef, F
from .forms import UserForm, ProfileForm, UserEditForm, PlayerEditForm
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.utils.encoding import force_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
import datetime  # load dotenv
from dotenv import load_dotenv
import decimal
from .utils import *

# load .env file
load_dotenv()


def authenticate_google(request):
    scopes = ['https://www.googleapis.com/auth/calendar']
    flow = InstalledAppFlow.from_client_secrets_file(
        settings.GOOGLE_API_CLIENT_SECRETS_FILE, scopes=scopes)
    credentials = flow.run_local_server(port=8080)
    pickle.dump(credentials, open(settings.GOOGLE_API_TOKEN_FILE, "wb"))

    return redirect('get_calendars')


def get_service():
    credentials = pickle.load(open(settings.GOOGLE_API_TOKEN_FILE, "rb"))
    return build("calendar", "v3", credentials=credentials)


def calendar(request):
    calendar_id = "88fe0d3e9ce1b2cc965deeb2b3ef2f70ab036e0e2f9267dddf548d09ac391135@group.calendar.google.com"
    service = get_service()
    result = service.events().list(calendarId=calendar_id,
                                   timeZone="Asia/Beirut").execute()
    events = result['items']
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event_data = form.cleaned_data
            start_time = event_data['start_time']
            end_time = start_time + timedelta(hours=event_data['duration'])
            timezone = 'Asia/Beirut'
            event = {
                'summary': event_data['summary'],
                'location': event_data['location'],
                'description': event_data['description'],
                'start': {
                    'dateTime': start_time.strftime("%Y-%m-%dT%H:%M:%S"),
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': end_time.strftime("%Y-%m-%dT%H:%M:%S"),
                    'timeZone': timezone,
                },
                'organizer': {
                    'displayName': event_data['organizer_display_name'],
                    'email': event_data['organizer_email'],
                },
            }

            service.events().insert(
                calendarId=calendar_id, body=event).execute()
            return redirect(reverse('create_event'))

        else:
            print("Form is not valid")

    else:
        form = EventForm()

    return render(request, 'calendar.html', {'form': form, 'events': events})


def view_images(request):
    images = CanvasImage.objects.all()
    return render(request, 'view_images.html', {'images': images})


def save_canvas_image(request):
    if request.method == 'POST':
        image_data = request.POST.get('image_data')
        title = request.POST.get('title', None)
        canvas_image = CanvasImage(image_data=image_data, title=title)
        canvas_image.save()
        return JsonResponse({'status': 'success', 'message': 'Image saved.', 'image_id': canvas_image.id})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})


def delete_canvas_image(request, image_id):
    if request.method == 'POST':
        image = get_object_or_404(CanvasImage, id=image_id)
        image.delete()
        # return JsonResponse({"status": "success"})
        return redirect('view_images')

    else:
        return JsonResponse({"status": "error", "message": "Invalid request method"})


def whiteboard(request):
    return render(request, 'whiteboard.html')


def basketball_whiteboard(request):
    return render(request, 'basketball_whiteboard.html')


def user_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None and user.is_active:
            login(request, user)
            return redirect_user(user)

        else:
            messages.info(request, 'Username or password is incorrect')

    return render(request, 'login.html', {})


@login_required
def user_logout(request):
    logout(request)
    return redirect('login')


def register(request):
    user_form = UserForm()
    profile_form = ProfileForm()
    if request.method == 'POST':
        user_form = UserForm(request.POST)
        profile_form = ProfileForm(request.POST)
        if user_form.is_valid() and profile_form.is_valid():
            user = create_profile(request=request, user_form=user_form,
                                  profile_form=profile_form)

            # login(request, user)

            return redirect("login")

    return render(request, 'register.html', {'user_form': user_form, 'profile_form': profile_form})


def verify_user(request, uidb64, token):
    id = force_str(urlsafe_base64_decode(uidb64))
    user = Profile.objects.get(user__pk=id)
    if user.user.is_active:
        return redirect('login')
    user.user.is_active = True
    user.user.save()
    return redirect('login')


@login_required
@user_passes_test(is_player)
def player_after_login(request):

    if request.method == 'POST':
        print("herer")
        amount_to_pay = float(request.POST.get('amount', 0))
        print(request.POST)
        # convert amount_to_pay to decimal.Decimal
        amount_to_pay = decimal.Decimal(amount_to_pay)

        user = request.user
        player = Player.objects.get(profile__user=user)
        payments = Payment.objects.filter(
            player=player, amount__gt=0).order_by('date')
        for payment in payments:
            if amount_to_pay >= payment.amount:
                amount_to_pay -= payment.amount
                payment.amount = 0
            else:
                payment.amount -= amount_to_pay
                amount_to_pay = 0
            payment.save()
            if amount_to_pay == 0:
                break
        player.pending_payment = sum(payment.amount for payment in payments)
        player.save()

        create_notification(player.profile, player.profile, "Payment of " +
                            str(amount_to_pay) + " made by" + player.profile.user.username +
                            " on " + str(datetime.date.today()))

        payment.save()
    current_player = Player.objects.get(profile__user=request.user)

    # get payments where player is the current player
    payments = Payment.objects.filter(player=current_player)
    announcements = Announcement.objects.all().order_by('-datetime')

    return render(request, 'player_after_login.html', {'player': current_player, "payments": payments, "announcements": announcements})


@login_required
@user_passes_test(is_coach)
def coach_after_login(request):
    current_coach = Coach.objects.get(profile__user=request.user)
    players = Player.objects.all()

    return render(request, 'coach_after_login.html', {'coach': current_coach, 'players': players})


@login_required
@user_passes_test(not_player)
def announcements(request):

    if request.method == "POST":
        announcement = Announcement()
        announcement.message = request.POST.get('message')
        announcement.owner = Profile.objects.get(user=request.user)
        announcement.save()
    announcements = Announcement.objects.all().order_by('-datetime')

    return render(request, 'announcements.html', {'announcements': announcements})


@ login_required
@ user_passes_test(is_manager)
def manager_after_login(request):

    current_manager = Manager.objects.get(profile__user=request.user)

    all_players = Player.objects.all()
    all_coaches = Coach.objects.all()
    all_notifications = Notification.objects.all().order_by('-created_at')
    all_payments = Payment.objects.all()

    # take one occurence for each date
    distinct_dates = Payment.objects.values('date').distinct()

    all_payments = Payment.objects.filter(
        id__in=Subquery(
            distinct_dates.annotate(
                id=F('id'),
            ).values('id')
        )
    )

    return render(request, 'manager_after_login.html', {'manager': current_manager, 'players': all_players, 'coaches': all_coaches, 'notifications': all_notifications, 'payments': all_payments})


@ login_required
@ user_passes_test(not_player)
def edit_player_profile(request, username):
    player = Player.objects.get(profile__user__username=username)
    payments = Payment.objects.filter(player=player)
    player_form = PlayerEditForm(instance=player)
    user_form = UserEditForm(instance=player.profile.user)
    if request.method == 'POST':
        user_form = UserEditForm(request.POST, instance=player.profile.user)
        player_form = PlayerEditForm(request.POST, instance=player)
        if player_form.is_valid() and user_form.is_valid():
            player_form.save()
            user_form.save()
            return redirect_user(request.user)
    return render(request, 'edit_profile.html', {'player_form': player_form, 'form': user_form, 'player': player, 'payments': payments})


@ login_required
@ user_passes_test(is_manager)
def edit_coach_profile(request, username):
    coach = Coach.objects.get(profile__user__username=username)
    user_form = UserEditForm(instance=coach.profile.user)
    if request.method == 'POST':
        user_form = UserEditForm(request.POST, instance=coach.profile.user)
        if user_form.is_valid():
            user_form.save()
            return redirect_user(request.user)
    return render(request, 'edit_profile.html', {'form': user_form})


@login_required
@user_passes_test(not_player)
def delete_player_profile(request, username):
    player = Player.objects.get(profile__user__username=username)
    player.profile.user.delete()
    player.delete()
    if is_coach(request.user):
        return redirect('_after_login')
    return redirect('manager_after_login')


@ login_required
@ user_passes_test(is_manager)
def delete_coach_profile(request, username):
    coach = Coach.objects.get(profile__user__username=username)
    coach.profile.user.delete()
    coach.delete()
    return redirect('manager_after_login')


@ login_required
@ user_passes_test(is_manager)
def advance_month(request):
    print("test")

    print("test inside")
    players = Player.objects.all()
    for player in players:
        player.pending_payment += 100
        player.save()
        latest_payment = Payment.objects.filter(
            player=player).order_by('-date').first()
        if latest_payment:
            latest_date = latest_payment.date
        else:
            latest_date = datetime.date.today()

        payment_date = latest_date.replace(
            day=1) + datetime.timedelta(days=31)
        payment_date = payment_date.replace(day=1)
        payment = Payment(player=player, amount=100, date=payment_date)
        payment.save()
        return redirect('manager_after_login')


@ login_required
@ user_passes_test(is_player)
def make_payment(request):
    if request.method == 'POST':
        print("herer")
        amount_to_pay = float(request.POST.get('amount', 0))
        user = request.user
        player = Player.objects.get(profile__user=user)
        payments = Payment.objects.filter(
            user=user, amount__gt=0).order_by('date')
        for payment in payments:
            if amount_to_pay >= payment.amount:
                amount_to_pay -= payment.amount
                payment.amount = 0
            else:
                payment.amount -= amount_to_pay
                amount_to_pay = 0
            payment.save()
            if amount_to_pay == 0:
                break
        player.pending_payment = sum(payment.amount for payment in payments)
        player.save()

        if amount_to_pay > 0:
            create_notification(player.profile, player.profile, "Payment of " +
                                str(amount_to_pay) + " made by" + player.profile.user.username +
                                " on " + str(datetime.date.today()))

        payment.save()
    return redirect('player_after_login')
